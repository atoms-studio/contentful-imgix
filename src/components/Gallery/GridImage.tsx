import { FunctionComponent, MouseEventHandler } from 'react';
import Imgix from 'react-imgix';

import './GridImage.css';

interface GridImageComponentProps {
  imageSrc: string;
  path: string;
  selected: boolean;
  handleClick: MouseEventHandler<HTMLDivElement>;
}

export const GridImage: FunctionComponent<GridImageComponentProps> = ({
  imageSrc,
  path,
  selected,
  handleClick,
}) => {
  const focus = selected ? ' ix-selected' : '';
  return (
    <div onClick={handleClick} className="ix-gallery-item" title={path}>
      <div className={'ix-gallery-image-gradient' + focus}></div>
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
    </div>
  );
};
