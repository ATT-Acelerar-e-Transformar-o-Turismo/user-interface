import React from 'react';
import PageTemplate from '../pages/PageTemplate';
import Table from './Table';

export default function ManagementTemplate({
  title,
  tableContent,
  emptyMessage,
  visibleColumns,
  actions,
  renderCellContent,
  headerActions,
  sortingInfo,
  showSearchBox = true
}) {
  return (
    <PageTemplate showSearchBox={showSearchBox}>
      <div className="flex justify-center">
        <div className="p-8 rounded-lg shadow-lg w-full">
          <h1 className="text-xl font-bold text-center mb-6">{title}</h1>
          <div className="flex flex-row-reverse mb-4">{headerActions}</div>
          <Table
            content={tableContent.map(row => ({
              ...row,
              ...(renderCellContent
                ? Object.fromEntries(
                    visibleColumns.map(column => [
                      column,
                      renderCellContent(column, row[column], row)
                    ])
                  )
                : {})
            }))}
            emptyMessage={emptyMessage}
            visibleColumns={visibleColumns}
            actions={actions}
            sortingInfo={sortingInfo}
          />
        </div>
      </div>
    </PageTemplate>
  );
}
