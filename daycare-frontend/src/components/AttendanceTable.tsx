import AttendanceRow from "./AttendanceRow";

export default function AttendanceTable({records,refresh}:any){
  return(
    <div className="bg-white rounded-xl shadow overflow-hidden">

      <table className="w-full text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Child</th>
            <th className="p-3">Check In</th>
            <th className="p-3">Check Out</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {records.map((r:any)=>(
            <AttendanceRow key={r.id} r={r} refresh={refresh}/>
          ))}
        </tbody>
      </table>

    </div>
  );
}