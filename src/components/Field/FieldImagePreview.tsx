import { ReactElement } from 'react';
import { Button } from '@contentful/forma-36-react-components';
import Imgix from 'react-imgix';
import { ImageData } from '../Gallery/ImageGallery';

import './FieldImagePreview.css';

interface FieldImagePreviewProps {
  imageData: ImageData;
  updateHeight: Function;
  openDialog: Function;
  clearSelection: Function;
}

export function FieldImagePreview({
  imageData,
  openDialog,
  updateHeight,
  clearSelection,
}: FieldImagePreviewProps): ReactElement {
  updateHeight(311);
  return (
    <div className="ix-field-image-preview">
      <Imgix
        width={230}
        height={230}
        src={imageData?.url}
        imgixParams={{
          auto: 'format',
          fit: 'crop',
          crop: 'entropy',
        }}
      />
      <div className="ix-field-image-preview-buttons">
        <Button
          className="ix-field-image-preview-buttons-replace"
          icon="Plus"
          buttonType="primary"
          onClick={() => openDialog()}
        >
          Replace
        </Button>
        <Button
          className="ix-field-image-preview-buttons-remove"
          icon="Delete"
          buttonType="negative"
          onClick={() => clearSelection()}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
