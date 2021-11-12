// import { useState } from 'react';
import { Subheading, Table, TableHead, TableBody, TableRow, TableCell, Icon, Spinner } from '@contentful/forma-36-react-components';
import { UploadCompleteItem, UploadInProgressItem, UploadPreviewItem } from './UploadPanel'
import { formatDate, formatSize } from '../../helpers/formatters'

import './UploadPanelSection.css';

interface UploadPanelSectionProps {
  title: string
  items: Array<UploadCompleteItem | UploadInProgressItem | UploadPreviewItem>
  mode: 'preview' | 'in-progress' | 'complete',
  current?: UploadInProgressItem | null
  onClear?: () => void
}

export function UploadPanelSection({
  title,
  items,
  mode,
  current,
  onClear,
}: UploadPanelSectionProps) {
  let headers = []
  switch (mode) {
    case 'preview':
      headers = ['File Name', 'Type', 'Size']
      break
    case 'in-progress':
      headers = ['File Name', 'Path', 'Type', 'Size']
      break
    case 'complete':
      headers = ['Full path', 'Size', 'Upload Started']
  }

  const renderList = () => {
    switch (mode) {
      case 'preview':
        return (items as UploadInProgressItem[]).map((item) => (
          <TableRow key={item.key}>
            <TableCell>
              <Icon color="primary" icon="Asset" />
            </TableCell>
            <TableCell>{ item.fileName }</TableCell>
            <TableCell>{ item.type }</TableCell>
            <TableCell>{ formatSize(item.size) }</TableCell>
          </TableRow>
        ))
      case 'in-progress':
        if (items.length === 0) {
          return (
            <TableRow>
              <TableCell colSpan={5} className="ix-upload-panel-empty-cell" style={ {height: '90px'} }>
                Uploads in progress will appear here
              </TableCell>
            </TableRow>
          )
        }

        return (items as UploadInProgressItem[]).map((item) => (
          <TableRow key={item.key}>
            <TableCell>
              { current && current.key === item.key ? <Spinner /> : <Icon color="muted" icon="Clock" /> }
            </TableCell>
            <TableCell>{ item.fileName }</TableCell>
            <TableCell>{ item.path }</TableCell>
            <TableCell>{ item.type }</TableCell>
            <TableCell>{ formatSize(item.size) }</TableCell>
          </TableRow>
        ))
      case 'complete':
        if (items.length === 0) {
          return (
            <TableRow>
              <TableCell colSpan={5} className="ix-upload-panel-empty-cell" style={ {height: '90px'} }>
                Finished uploads will appear here
              </TableCell>
            </TableRow>
          )
        }

        return (items as UploadCompleteItem[]).map((item) => (
          <TableRow key={item.key}>
            <TableCell>
              {item.error ? <Icon color="negative" icon="Warning" /> : <Icon color="positive" icon="CheckCircle" />}
            </TableCell>
            <TableCell>
              { item.fullPath }
              { item.error && <div className="error-message">{ item.error.message }</div> }
            </TableCell>
            <TableCell>{ formatSize(item.size) }</TableCell>
            <TableCell>{ formatDate(item.startedAt) }</TableCell>
          </TableRow>
        ))
    }
  }

  return (
    <div className="ix-upload-panel-section">
      <div className="ix-upload-panel-section-header">
        <Subheading>{ title } ({items.length})</Subheading>
        {( onClear && <button onClick={onClear}>Clear</button> )}
      </div>
      <div>
      <Table className="ix-upload-panel-table">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            {headers.map(header => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
            { renderList() }
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
