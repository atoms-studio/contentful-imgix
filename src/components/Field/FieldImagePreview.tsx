import { ReactElement, useState, useEffect } from 'react';
import { Button } from '@contentful/forma-36-react-components';
import Imgix from 'react-imgix';
import { ImageData } from '../Gallery/ImageGallery';
import { formatSize } from '../../helpers/formatters'

import './FieldImagePreview.css';

const MAX_DIMENSION = 230
const CONTAINER_BOTTOM_OFFSET = 145
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
  const [width, setWidth] = useState(MAX_DIMENSION)
  const [height, setHeight] = useState(MAX_DIMENSION)

  useEffect(() => {
    const imgWidth = imageData?.details?.image?.width || MAX_DIMENSION
    const imgHeight = imageData?.details?.image?.height || MAX_DIMENSION
    const aspectRatio = imgWidth / imgHeight

    let newHeight = MAX_DIMENSION;
    let newWidth = newHeight * aspectRatio;

    setWidth(newWidth);
    setHeight(newHeight);
    updateHeight(newHeight + CONTAINER_BOTTOM_OFFSET);
  }, [imageData, updateHeight])

  return (
    <div className="ix-field-image-preview">
      <a href={imageData?.url} target="_blank" rel="noopener noreferrer">
        <Imgix
          width={width}
          height={height}
          src={imageData?.url}
          imgixParams={{
            auto: 'format',
            fit: 'crop',
            crop: 'entropy',
          }}
        />
      </a>
      <div className="ix-field-image-preview-info">
        <p>{imageData?.path}</p>
        <p>{imageData?.details?.image?.width} x {imageData?.details?.image?.height}</p>
        <p>{formatSize(imageData?.details?.size)}</p>
      </div>
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
