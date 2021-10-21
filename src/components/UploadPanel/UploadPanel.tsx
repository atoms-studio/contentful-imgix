import { useState, useRef } from 'react';
import { UploadPanelSection } from './UploadPanelSection'
import { SourceProps } from '../Dialog';
import ImgixAPI, { APIError } from 'imgix-management-js';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Button } from '@contentful/forma-36-react-components'

import './UploadPanel.css';

interface UploadPanelProps {
  selectedSource: Partial<SourceProps>
  imgix: ImgixAPI;
  sdk: DialogExtensionSDK;
}

export interface UploadCompleteItem {
  fullPath: string
  size: number
  startedAt: number
  error: APIError | null
}

export interface UploadInProgressItem {
  fileName: string
  path: string
  type: string
  size: number
}

export function UploadPanel({
  selectedSource,
  imgix,
  sdk,
}: UploadPanelProps) {
  const [uploadsCompleteItems, setUploadsCompleteItems] = useState<UploadCompleteItem[]>([]);
  const [uploadsInProgressItems, setUploadsInProgressItems] = useState<UploadInProgressItem[]>([]);
  const uploadInput = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | null) => {
    console.log(uploadInput.current?.files, e)
    if (uploadInput.current?.files) {
      const files = Array.from(uploadInput.current.files)
      setUploadsInProgressItems([
        ...uploadsInProgressItems,
        ...files.map(file => ({
          fileName: file.name,
          path: '/',
          type: file.type,
          size: file.size,
        })),
      ])

      console.log([
        ...uploadsInProgressItems,
        ...files.map(file => ({
          fileName: file.name,
          type: file.type,
          size: file.size,
        })),
      ])
    }
  }

  return (
    <div className="ix-upload-panel">
      <div>
        <Button
          size="small"
          icon="Asset"
          buttonType="primary"
          onClick={() => uploadInput.current?.click()}
        >
          Upload images
        </Button>
        <input type="file" style={ {display: 'none'} } ref={uploadInput} accept="image/*" multiple onChange={handleFileChange} />
      </div>
      <UploadPanelSection title="Finished" items={uploadsCompleteItems} inProgress={false} />
      <UploadPanelSection title="In progress" items={uploadsInProgressItems} inProgress={true} />
    </div>
  );
}
