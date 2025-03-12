import React from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'


const columnHelper = createColumnHelper()
const columns = [
  columnHelper.accessor('name', {
    cell: info => info.getValue(),
    footer: info => info.column.id,
  }),
  columnHelper.accessor('periodicity', {
    cell: info => info.getValue(),
    footer: info => info.column.id,
  }),
  columnHelper.accessor('domain', {
    cell: info => info.getValue(),
    footer: info => info.column.id,
  }),
  columnHelper.accessor('favourites', {
    cell: info => info.getValue(),
    footer: info => info.column.id,
  }),
]



export default function Table({content, editAction, deleteAction}) {
  const [data, _setData] = React.useState(() => [...content])
  const rerender = React.useReducer(() => ({}), {})[1]

  const handleEdit = (id) => {
    editAction(id);
  };

  const handleDelete = (id) => {
    deleteAction(id);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="p-2">
      <table className='table'>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
              <th key="actions">
                actions
              </th>
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
              <td key={`actions-${row.id}`}>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => handleEdit(row.original.id)} className="btn btn-primary btn-sm">Edit</button>
                  <button onClick={() => handleDelete(row.original.id)} className="btn btn-secondary btn-sm">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="h-4" />
      <button onClick={() => rerender()} className="btn btn-outline btn-sm">
        Rerender
      </button>
    </div>

  );
}