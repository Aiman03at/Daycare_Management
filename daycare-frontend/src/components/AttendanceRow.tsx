import { api } from "../api/client";

export default function AttendanceRow({r,refresh}:any){

  const checkout = async ()=>{
    await api.post("/attendance/checkout", { child_id: r.child_id });
    refresh();
  };

  const format=(t:any)=>{
    if(!t) return "—";
    return new Date(t).toLocaleTimeString([],{
      hour:"2-digit",
      minute:"2-digit"
    });
  };

  const getStatus=()=>{
    if(!r.check_in) return {text:"Absent",color:"bg-red-100 text-red-600"};
    if(r.check_in && !r.check_out) return {text:"In Daycare",color:"bg-yellow-100 text-yellow-700"};
    return {text:"Completed",color:"bg-green-100 text-green-700"};
  };

  const status=getStatus();

  return(
    <tr className="border-t">

      <td className="p-3 font-medium">{r.name}</td>

      <td className="p-3">{format(r.check_in)}</td>

      <td className="p-3">{format(r.check_out)}</td>

      <td className="p-3">
        <span className={`px-3 py-1 rounded-full text-sm ${status.color}`}>
          {status.text}
        </span>
      </td>

      <td className="p-3">
        {!r.check_out && r.check_in && (
          <button
            onClick={checkout}
            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
          >
            Check Out
          </button>
        )}
      </td>

    </tr>
  );
}
