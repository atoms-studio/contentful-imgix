import React, { useState, useRef, useEffect } from 'react';
import { UploadPanelSection } from './UploadPanelSection'
import { UploadPanelPreview } from './UploadPanelPreview'
import { SourceProps } from '../Dialog';
import ImgixAPI, { APIError } from 'imgix-management-js';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Button } from '@contentful/forma-36-react-components'

import './UploadPanel.css';

interface UploadPanelProps {
  selectedSource: Partial<SourceProps>
  imgix: ImgixAPI;
  sdk: DialogExtensionSDK;
  onProgressUpdate: (progress: number) => void;
}

export interface UploadCompleteItem {
  key: string
  fullPath: string
  size: number
  startedAt: number
  error: APIError | null
}
export interface UploadPreviewItem {
  key: string
  fileName: string
  type: string
  size: number
  _fileData: File
}

export type UploadInProgressItem = UploadPreviewItem & {
  path: string
}

export function UploadPanel({
  selectedSource,
  imgix,
  sdk,
  onProgressUpdate,
}: UploadPanelProps) {
  const [uploadCompleteItems, setUploadCompleteItems] = useState<UploadCompleteItem[]>([]);
  const [uploadInProgressItems, setUploadInProgressItems] = useState<UploadInProgressItem[]>([]);
  const [uploadPreviewItems, setUploadPreviewItems] = useState<UploadPreviewItem[]>([]);
  const uploadInput = useRef<HTMLInputElement>(null);
  const [currentUpload, setCurrentUpload] = useState<UploadInProgressItem | null>(null);
  const [inputKey, setInputKey] = useState(Math.random().toString(36));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | null) => {
    if (uploadInput.current?.files) {
      const files = Array.from(uploadInput.current.files)

      const previewItems = [...uploadPreviewItems]
      for (const file of files) {
        previewItems.push({
          key: `${file.name}|${file.lastModified}|${new Date()}`,
          fileName: file.name,
          type: file.type,
          size: file.size,
          _fileData: file,
        })
      }
      setUploadPreviewItems(previewItems)
    }
  }

  // Start uploading selected items.
  const handleUploadConfirm = async (path: string) => {
    let normalizedPath = path
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`
    }
    if (!normalizedPath.endsWith('/')) {
      normalizedPath = `${normalizedPath}/`
    }

    const newPendingItems = uploadPreviewItems.map(item => {
      return {
        ...item,
        path: normalizedPath,
      } 
    })

    setUploadPreviewItems([])
    setUploadInProgressItems([...uploadInProgressItems, ...newPendingItems])
    setInputKey(Math.random().toString(36))
  }

  const handleUploadCancel = () => {
    setUploadPreviewItems([])
    setInputKey(Math.random().toString(36))
  }

  useEffect(() => {
    const upload = async (item: UploadInProgressItem) => {
      setCurrentUpload(item)
      const completeItem = {
        key: item.key,
        fullPath: `${item.path}${item.fileName}`,
        size: item.size,
        startedAt: Date.now(),
        error: null
      }

      try {
        // imgix sdk is broken on file uploads from the browser
        await fetch(`https://api.imgix.com/api/v1/sources/upload/${selectedSource.id}${item.path}${item.fileName}`, {
          method: 'POST',
          body: item._fileData,
          headers: {
            Authorization: `Bearer ${(imgix as any).settings.apiKey}`,
          }
        })
      } catch (err: any) {
        completeItem.error = err
      }

      const newInProgressItems = uploadInProgressItems.slice()
      newInProgressItems.shift()
      setUploadInProgressItems(newInProgressItems)
      setUploadCompleteItems([...uploadCompleteItems, completeItem])
      setCurrentUpload(null)
    }

    onProgressUpdate(uploadInProgressItems.length)
    if (uploadInProgressItems.length && !currentUpload) {
      upload(uploadInProgressItems[0])
    }
  }, [ uploadInProgressItems, currentUpload, uploadCompleteItems, imgix, selectedSource.id, onProgressUpdate ])

  return (
    <div className="ix-upload-panel">
      <div>
        <Button
          icon="Asset"
          buttonType="primary"
          onClick={() => uploadInput.current?.click()}
        >
          Upload images
        </Button>
        <input type="file" key={inputKey} style={ {display: 'none'} } ref={uploadInput} accept="image/*" multiple onChange={handleFileChange} />
      </div>

      {(
        uploadPreviewItems.length ? (
          <UploadPanelPreview items={uploadPreviewItems} onConfirm={handleUploadConfirm} onCancel={handleUploadCancel} />
        ) : (
          <React.Fragment>
            <UploadPanelSection title="Finished" items={uploadCompleteItems} mode="complete" />
            <UploadPanelSection title="In progress" items={uploadInProgressItems} mode="in-progress" current={currentUpload} />
          </React.Fragment>
        )
      )}
      
    </div>
  );
}
