import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AttendanceToolbar({ refresh }:any){
  const [children,setChildren]=useState([]);
  const [selected,setSelected]=useState("");

  useEffect(()=>{
    api.get("/children").then(res=>setChildren(res.data));
  },[]);

  const checkIn = async ()=>{
    if(!selected) return alert("Select child");

    await api.post("/attendance/checkin", { child_id: selected });
    refresh();
  };

  return(
    <div className="flex gap-4 bg-white p-4 rounded-xl shadow">

      <select
        className="border px-3 py-2 rounded"
        value={selected}
        onChange={e=>setSelected(e.target.value)}
      >
        <option value="">Select Child</option>
        {children.map((c:any)=>(
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <button
        onClick={checkIn}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Check In
      </button>

    </div>
  );
}
