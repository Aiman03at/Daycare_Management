import { Router } from "express";
import pool from "../db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

let messagesSchemaReady: Promise<void> | null = null;

export const ensureMessagesSchema = async () => {
  if (!messagesSchemaReady) {
    messagesSchemaReady = (async () => {
      // Create messages table
      await pool.query(
        `
          CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message_text TEXT NOT NULL,
            child_id INT REFERENCES children(id) ON DELETE SET NULL,
            group_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_archived BOOLEAN DEFAULT FALSE,
            parent_email TEXT,
            parent_phone TEXT
          )
        `
      );

      // Create message recipients table for storing which parents receive the message
      await pool.query(
        `
          CREATE TABLE IF NOT EXISTS message_recipients (
            id SERIAL PRIMARY KEY,
            message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            recipient_id INT REFERENCES users(id) ON DELETE CASCADE,
            recipient_email TEXT,
            recipient_phone TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      );

      // Create message replies table for threading
      await pool.query(
        `
          CREATE TABLE IF NOT EXISTS message_replies (
            id SERIAL PRIMARY KEY,
            message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reply_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      );

      // Add indexes for faster queries
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`
      );

      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_messages_child_id ON messages(child_id)`
      );

      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_messages_group_name ON messages(group_name)`
      );

      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON message_recipients(recipient_id)`
      );

      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON message_recipients(message_id)`
      );
    })().catch((error) => {
      messagesSchemaReady = null;
      throw error;
    });
  }

  await messagesSchemaReady;
};

// GET all messages for current user (educator/parent)
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMessagesSchema();
    const { role } = req.user;
    const userId = req.user.id;
    const { archived } = req.query;

    let query = "";
    let params: any[] = [];

    if (role === "educator" || role === "admin") {
      // Educators see messages they sent
      query = `
        SELECT DISTINCT m.*,
        ARRAY_AGG(DISTINCT mr.recipient_email) FILTER (WHERE mr.recipient_email IS NOT NULL) as recipient_emails,
        ARRAY_AGG(DISTINCT mr.recipient_phone) FILTER (WHERE mr.recipient_phone IS NOT NULL) as recipient_phones,
        COUNT(DISTINCT mr.id) FILTER (WHERE mr.is_read = FALSE) as unread_count,
        u.name as sender_name
        FROM messages m
        LEFT JOIN message_recipients mr ON m.id = mr.message_id
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.sender_id = $1
        ${archived === "true" ? "AND m.is_archived = TRUE" : "AND m.is_archived = FALSE"}
        GROUP BY m.id, u.name
        ORDER BY m.created_at DESC
      `;
      params = [userId];
    } else if (role === "parent") {
      // Parents see messages sent to them
      query = `
        SELECT DISTINCT m.*,
        u.name as sender_name,
        mr.is_read,
        mr.read_at
        FROM messages m
        LEFT JOIN message_recipients mr ON m.id = mr.message_id
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE mr.recipient_id = $1
        ${archived === "true" ? "AND m.is_archived = TRUE" : "AND m.is_archived = FALSE"}
        ORDER BY m.created_at DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GET message thread with replies
router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMessagesSchema();
    const { id } = req.params;

    // Get main message
    const messageResult = await pool.query(
      `SELECT m.*, u.name as sender_name, u.email as sender_email
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.id = $1`,
      [id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Get recipients
    const recipientsResult = await pool.query(
      `SELECT * FROM message_recipients WHERE message_id = $1`,
      [id]
    );

    // Get replies
    const repliesResult = await pool.query(
      `SELECT mr.*, u.name as sender_name, u.email as sender_email
       FROM message_replies mr
       LEFT JOIN users u ON mr.sender_id = u.id
       WHERE mr.message_id = $1
       ORDER BY mr.created_at ASC`,
      [id]
    );

    const message = messageResult.rows[0];
    message.recipients = recipientsResult.rows;
    message.replies = repliesResult.rows;

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch message thread" });
  }
});

// SEND MESSAGE - to single parent/child
router.post("/send-to-parent", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMessagesSchema();
    const { role } = req.user;
    const senderId = req.user.id;

    if (role !== "educator" && role !== "admin") {
      return res.status(403).json({ error: "Only educators can send messages" });
    }

    const { message_text, child_id, recipient_user_id } = req.body;

    if (!message_text || (!child_id && !recipient_user_id)) {
      return res.status(400).json({ error: "Message text and child_id or recipient_user_id required" });
    }

    // Get child info to find parent
    let parentUserId = recipient_user_id;
    let parentEmail = null;
    let parentPhone = null;

    if (child_id && !recipient_user_id) {
      const childResult = await pool.query(
        "SELECT parent_name, parent_phone FROM children WHERE id = $1",
        [child_id]
      );

      if (childResult.rows.length === 0) {
        return res.status(404).json({ message: "Child not found" });
      }

      const child = childResult.rows[0];
      parentPhone = child.parent_phone;
    }

    // Create message
    const messageResult = await pool.query(
      `INSERT INTO messages(sender_id, message_text, child_id, parent_email, parent_phone)
       VALUES($1, $2, $3, $4, $5)
       RETURNING *`,
      [senderId, message_text, child_id || null, parentEmail, parentPhone]
    );

    const message = messageResult.rows[0];

    // Create recipient entry
    await pool.query(
      `INSERT INTO message_recipients(message_id, recipient_id, recipient_email, recipient_phone)
       VALUES($1, $2, $3, $4)`,
      [message.id, parentUserId || null, parentEmail, parentPhone]
    );

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// SEND MESSAGE - to multiple parents
router.post("/send-to-multiple", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMessagesSchema();
    const { role } = req.user;
    const senderId = req.user.id;

    if (role !== "educator" && role !== "admin") {
      return res.status(403).json({ error: "Only educators can send messages" });
    }

    const { message_text, recipient_user_ids, child_ids } = req.body;

    if (!message_text || (!recipient_user_ids && !child_ids)) {
      return res.status(400).json({ 
        error: "Message text and recipient_user_ids or child_ids required" 
      });
    }

    // Create message
    const messageResult = await pool.query(
      `INSERT INTO messages(sender_id, message_text)
       VALUES($1, $2)
       RETURNING *`,
      [senderId, message_text]
    );

    const message = messageResult.rows[0];
    const recipients = [];

    // Add user recipients
    if (recipient_user_ids && recipient_user_ids.length > 0) {
      for (const userId of recipient_user_ids) {
        const recipientResult = await pool.query(
          `INSERT INTO message_recipients(message_id, recipient_id)
           VALUES($1, $2)
           RETURNING *`,
          [message.id, userId]
        );
        recipients.push(recipientResult.rows[0]);
      }
    }

    // Add recipients from child parents
    if (child_ids && child_ids.length > 0) {
      const childResult = await pool.query(
        `SELECT DISTINCT parent_phone, parent_name FROM children WHERE id = ANY($1)`,
        [child_ids]
      );

      for (const child of childResult.rows) {
        const recipientResult = await pool.query(
          `INSERT INTO message_recipients(message_id, recipient_phone)
           VALUES($1, $2)
           RETURNING *`,
          [message.id, child.parent_phone]
        );
        recipients.push(recipientResult.rows[0]);
      }
    }

    message.recipients = recipients;
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// SEND MESSAGE - to whole group/class
router.post("/send-to-group", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMessagesSchema();
    const { role } = req.user;
    const senderId = req.user.id;

    if (role !== "educator" && role !== "admin") {
      return res.status(403).json({ error: "Only educators can send messages" });
    }

    const { message_text, group_name } = req.body;

    if (!message_text || !group_name) {
      return res.status(400).json({ error: "Message text and group_name required" });
    }

    // Create group message
    const messageResult = await pool.query(
      `INSERT INTO messages(sender_id, message_text, group_name)
       VALUES($1, $2, $3)
       RETURNING *`,
      [senderId, message_text, group_name]
    );

    const message = messageResult.rows[0];

    // Get all parents from this age group
    const childrenResult = await pool.query(
      `SELECT DISTINCT parent_phone, parent_name FROM children WHERE age >= 
       (CASE WHEN $1 = 'toddlers' THEN 1 AND age < 2.5
            WHEN $1 = 'preschoolers' THEN 2.5 AND age < 4
            WHEN $1 = 'kinder' THEN 4 AND age <= 5.5 END)
       ORDER BY parent_phone`,
      [group_name]
    );

    const recipients = [];
    // Create recipient entries
    for (const child of childrenResult.rows) {
      if (child.parent_phone) {
        const recipientResult = await pool.query(
          `INSERT INTO message_recipients(message_id, recipient_phone)
           VALUES($1, $2)
           RETURNING *`,
          [message.id, child.parent_phone]
        );
        recipients.push(recipientResult.rows[0]);
      }
    }

    message.recipients = recipients;
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send group message" });
  }
});

// REPLY TO MESSAGE
router.post("/:id/reply", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMessagesSchema();
    const { id } = req.params;
    const { reply_text } = req.body;
    const senderId = req.user.id;

    if (!reply_text) {
      return res.status(400).json({ error: "Reply text required" });
    }

    // Verify message exists
    const messageResult = await pool.query(
      "SELECT * FROM messages WHERE id = $1",
      [id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Create reply
    const replyResult = await pool.query(
      `INSERT INTO message_replies(message_id, sender_id, reply_text)
       VALUES($1, $2, $3)
       RETURNING *`,
      [id, senderId, reply_text]
    );

    res.json(replyResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add reply" });
  }
});

// ARCHIVE MESSAGE
router.put("/:id/archive", authMiddleware, async (req, res) => {
  try {
    await ensureMessagesSchema();
    const { id } = req.params;

    const messageResult = await pool.query(
      `UPDATE messages
       SET is_archived = TRUE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json(messageResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to archive message" });
  }
});

// UNARCHIVE MESSAGE
router.put("/:id/unarchive", authMiddleware, async (req, res) => {
  try {
    await ensureMessagesSchema();
    const { id } = req.params;

    const messageResult = await pool.query(
      `UPDATE messages
       SET is_archived = FALSE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json(messageResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unarchive message" });
  }
});

// MARK MESSAGE AS READ
router.put("/:id/read", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMessagesSchema();
    const { id } = req.params;
    const userId = req.user.id;

    const recipientResult = await pool.query(
      `UPDATE message_recipients
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE message_id = $1 AND recipient_id = $2
       RETURNING *`,
      [id, userId]
    );

    res.json(recipientResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// DELETE MESSAGE
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMessagesSchema();
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is the sender
    const messageResult = await pool.query(
      "SELECT * FROM messages WHERE id = $1 AND sender_id = $2",
      [id, userId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ message: "Message not found or unauthorized" });
    }

    // Delete message (cascade will delete replies and recipients)
    await pool.query("DELETE FROM messages WHERE id = $1", [id]);

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
