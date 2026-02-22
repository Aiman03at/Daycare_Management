import { useEffect, useState} from 'react';
import {api} from "../api/client";

interface Child {
    id: number;
    name: string;
    age: number;
    parentName?: string;
    parentPhone?: string;
}


export default function Children() {
    const [children, setChildren] = useState<Child[]>([]);

    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [editChild, setEditChild] = useState<Child | null>(null);
    useEffect(() => {
        api.get("/children")
            .then((res) => {
              console.log("Fetched children:", res.data);
                setChildren(res.data);
            })
            .catch((error) => {
                console.error("Error fetching children:", error);
            });
    }, []);


    
    

     
    
   //add anew child
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
    
     if (editChild) {
      await api.put(`/children/${editChild.id}`, { name, age, parentName, parentPhone });
    } else {
     await api.post("/children", { name, age, parentName, parentPhone });
    }
      window.location.reload();
};


//delete child
    const deleteChild = async (id: number) => {
        await api.delete(`/children/${id}`);
        window.location.reload();
    };
    //edit child
    const EditChild = (child: Child) => {
        setEditChild(child)
        setName(child.name);
        setAge(child.age.toString());
        setParentName(child.parentName || "");
        setParentPhone(child.parentPhone || "");
    };

    return(
    
    <div>
        <h1>Children List</h1>
        {
            children.map((child) => (
                <div key={child.id}>
                    <h2>{child.name}</h2> 
                    <p>Age: {child.age}</p>
                    <button onClick={() => deleteChild(child.id)}>Delete</button>
                    <button onClick={() => EditChild(child)}>Edit</button>
                    </div>
    
  ))}



  <form onSubmit={handleSubmit}>
  Name: <input value={name} onChange={e=>setName(e.target.value)} placeholder="Child's Name" /><br/>
  Age:<input value={age} onChange={e=>setAge(e.target.value)} placeholder="Age" /><br/>
  Parent Nmae:<input value={parentName} onChange={e=>setParentName(e.target.value)} placeholder="Parent's Name" /><br/>
  Parent Phone:<input value={parentPhone} onChange={e=>setParentPhone(e.target.value)} placeholder="Parent's Phone Number" /><br/>
  <button>
    {editChild ? "Update Child" : "Add Child"}</button>
  
</form>


  </div>
    )
  };