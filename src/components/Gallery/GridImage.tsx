import { FunctionComponent, MouseEvent, KeyboardEvent } from 'react';
import Imgix from 'react-imgix';
import { Card } from '@contentful/forma-36-react-components'

import './GridImage.css';

interface GridImageComponentProps {
  imageSrc: string;
  path: string;
  selected: boolean;
  handleClick: (e: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void;
}

export const GridImage: FunctionComponent<GridImageComponentProps> = ({
  imageSrc,
  path,
  selected,
  handleClick,
}) => {
  const focus = selected ? ' ix-selected' : '';
  return (
    <Card padding="none" onClick={handleClick} selected={selected} className={'ix-gallery-item' + focus} title={path}>
      <div className={'ix-gallery-image-gradient'}></div>
      <Imgix
        src={imageSrc}
        width={140}
        height={140}
        imgixParams={{
          auto: 'format',
          fit: 'crop',
          crop: 'entropy',
        }}
        sizes="(min-width: 480px) calc(12.5vw - 20px)"
      />
      <div className="ix-gallery-image-name">
        <span>{path}</span>
      </div>
    </Card>
  );
};
