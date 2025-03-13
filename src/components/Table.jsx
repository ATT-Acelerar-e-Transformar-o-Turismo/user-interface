import React from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

export default function Table({ content, editAction, deleteAction, emptyMessage, visibleColumns }) {
  const [data, setData] = React.useState(() => [...content])
  const rerender = React.useReducer(() => ({}), {})[1]

  React.useEffect(() => {
    setData([...content]);
    rerender()
    console.log(content.length)
  }, [content]);

  const handleEdit = (id) => {
    editAction(id);
  };

  const handleDelete = (id) => {
    deleteAction(id);
  };

  const columnHelper = createColumnHelper();
  const columns = visibleColumns.map(column => 
    columnHelper.accessor(column, {
      cell: info => info.getValue(),
      footer: info => info.column.id,
    })
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="p-2">
      {data.length === 0 ? (
        <p className="text-center">{emptyMessage}</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-base-300">
            <thead className="bg-base-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-base-content uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </th>
                  ))}
                  <th key="actions" className="px-6 py-3 text-left text-xs font-medium text-base-content uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-base-300">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td key={`actions-${row.id}`} className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => handleEdit(row.original.id)} className="btn btn-primary btn-sm">Edit</button>
                      <button onClick={() => handleDelete(row.original.id)} className="btn btn-secondary btn-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}