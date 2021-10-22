import { UploadPreviewItem } from './UploadPanel'
import { UploadPanelSection } from './UploadPanelSection'
import { Button, TextField } from '@contentful/forma-36-react-components'
import { useState } from 'react'

import './UploadPanelPreview.css'

interface UploadPanelConfirmationProps {
  items: UploadPreviewItem[];
  onConfirm: (path: string) => void;
  onCancel: () => void;
}

export function UploadPanelPreview ({
  items,
  onConfirm,
  onCancel,
}: UploadPanelConfirmationProps) {
  const [path, setPath] = useState('')

  return (
    <div>
      <UploadPanelSection title="Files to upload" items={items} mode="preview" />
      <div className="ix-upload-panel-preview-path">
        <TextField
          id="ix-destination-path"
          name="path"
          labelText="Specify a destination path"
          helpText="Images can be uploaded to any subdirectory in your image storage. Leave empty to upload to the root directory of your storage."
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
      </div>
      <div className="ix-upload-panel-preview-buttons">
        <Button
          buttonType="positive"
          onClick={() => onConfirm(path)}
        >
          Upload
        </Button>
        <Button
          buttonType="muted"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
