import React from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

export default function Table({ content, actions, emptyMessage, visibleColumns }) {
  const [data, setData] = React.useState(() => [...content])
  const rerender = React.useReducer(() => ({}), {})[1]

  React.useEffect(() => {
    setData([...content]);
    rerender()
    console.log(content.length)
  }, [content]);

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
                    <th key={header.id} className="px-4 py-2 text-left text-xs font-medium text-base-content uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </th>
                  ))}
                  <th key="actions" className="px-4 py-2 text-xs font-medium text-base-content uppercase tracking-wider text-left w-24">
                    Actions
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className="bg-base-100 divide-y divide-base-300">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-2 whitespace-nowrap text-ellipsis max-w-64">
                      <span className='block overflow-hidden hover:overflow-visible z-10 hover:z-50 relative'>
                        <span className="bg-base-100">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </span>
                    </td>
                  ))}
                  <td key={`actions-${row.id}`} className="px-4 py-2 w-24">
                    <div className="flex gap-1">
                      {actions.map((action, index) => (
                        <button key={index} onClick={() => {
                          const idToPass = row.original.id || row.original._id;
                          action.onClick(idToPass);
                        }} className={`btn ${action.className} btn-sm min-w-16`}>
                          {action.label}
                        </button>
                      ))}
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