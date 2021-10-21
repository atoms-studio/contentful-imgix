// import { useState } from 'react';
import { Subheading, Table, TableHead, TableBody, TableRow, TableCell, Icon, Spinner } from '@contentful/forma-36-react-components';
import { UploadCompleteItem, UploadInProgressItem } from './UploadPanel'

import './UploadPanelSection.css';

interface UploadPanelSectionProps {
  title: string
  items: Array<UploadCompleteItem | UploadInProgressItem>
  inProgress: boolean
}

export function UploadPanelSection({
  title,
  items,
  inProgress
}: UploadPanelSectionProps) {
  const headers = inProgress ?  ['File Name', 'Path', 'Type', 'Size'] : ['Full path', 'Size', 'Uplaod Started']

  const formatSize = (size: number) => {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="ix-upload-panel-section">
      <Subheading>{ title }</Subheading>
      <div>
      <Table className="ix-upload-panel-table">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            {headers.map(header => (
              <TableCell>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
            {inProgress ? (
              (items as UploadInProgressItem[]).map((item) => (
                <TableRow>
                  <TableCell>
                    <Spinner />
                  </TableCell>
                  <TableCell>{ item.fileName }</TableCell>
                  <TableCell>{ item.path }</TableCell>
                  <TableCell>{ item.type }</TableCell>
                  <TableCell>{ formatSize(item.size) }</TableCell>
                </TableRow>
              ))
            ) : (
              (items as UploadCompleteItem[]).map((item) => (
                <TableRow>
                  <TableCell>
                    {item.error ? <Icon color="negative" icon="Warning" /> : <Icon color="positive" icon="CheckCircle" />}
                  </TableCell>
                  <TableCell>
                    { item.fullPath }
                  </TableCell>
                  <TableCell>{ formatSize(item.size) }</TableCell>
                  <TableCell>{ item.startedAt }</TableCell>
                </TableRow>
              ))
            )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
