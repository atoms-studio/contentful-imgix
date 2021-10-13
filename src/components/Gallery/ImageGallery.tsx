import { Component } from 'react';
import ImgixAPI, { APIError } from 'imgix-management-js';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';

import { SourceProps, PageProps } from '../Dialog';
import { ImageSelectButton } from '../ImageSelect/ImageSelect';
import { GridImage, ImagePlaceholder, ImagePagination } from './';

import './ImageGallery.css';

interface GalleryProps {
  selectedSource: Partial<SourceProps>;
  imgix: ImgixAPI;
  sdk: DialogExtensionSDK;
  getTotalImageCount: (totalImageCount: number) => void;
  pageInfo: PageProps;
  changePage: (newPageIndex: number) => void;
}

export interface ImageData {
  url: string;
  details: Details;
  fileName: string;
  contentType: string;
}
interface Details {
  size: number;
  image: Image;
}
interface Image {
  width: number;
  height: number;
}
interface GalleryState {
  allImageData: ImageData[];
  selectedImage: ImageData;
}


export class Gallery extends Component<GalleryProps, GalleryState> {
  constructor(props: GalleryProps) {
    super(props);

    this.state = {
      allImageData: [],
      selectedImage: {} as ImageData,
    };
  }

  getImages = async () => {
    const assets = await this.props.imgix.request(
      `assets/${this.props.selectedSource?.id}?page[number]=${this.props.pageInfo.currentIndex}&page[size]=18`,
    );
    console.log(`getImages: assets/${this.props.selectedSource?.id}?page[number]=${this.props.pageInfo.currentIndex}&page[size]=18`);
    // TODO: add more explicit types for image
    this.props.getTotalImageCount(
      parseInt((assets.meta.cursor as any).totalRecords || 0),
    );
    return assets;
  };

  getImagesData = async () => {
    let images,
      allImageData: ImageData[] = [];

    try {
      images = await this.getImages();
    } catch (error) {
      // APIError will emit more helpful data for debugging
      if (error instanceof APIError) {
        console.error(error.toString());
      } else {
        console.error(error);
      }
      return allImageData;
    }

    /*
     * Resolved requests can either return an array of objects or a single
     * object via the `data` top-level field. When parsing all enabled sources,
     * both possibilities must be accounted for.
     */
    if (images) {
      const imagesArray = Array.isArray(images.data)
        ? images.data
        : [images.data];

      // Required focal point imgix attributes  
      // eslint-disable-next-line array-callback-return
      imagesArray.map((image: any) => {
          const imageData: ImageData = {
            url: this.constructUrl(image.attributes.origin_path),
            details: { 
              size: image.attributes.file_size, 
              image: { 
                width: image.attributes.media_width, 
                height: image.attributes.media_height 
              } 
            },
            fileName: image.attributes?.name || "",
            contentType: image.attributes.content_type
          };
          allImageData.push(imageData);
        })

      return allImageData;
    } else {
      return [];
    }
  };

  /*
   * Construct an imgix image URL from the selected source in the
   * application Dialog component
   */
  constructUrl(path: string) {
    const scheme = 'https://';
    const domain = this.props.selectedSource.name;
    const imgixDomain = '.imgix.net';
    return scheme + domain + imgixDomain + path;
  }

  /*
   * Requests and constructs fully-qualified image URLs, saving the results to
   * state
   */
  async requestImageUrls() {
    // if selected source, return images
    if (Object.keys(this.props.selectedSource).length) {
      const allImageData = await this.getImagesData();
      // if at least one path, remove placeholders

      if (allImageData.length) {
        this.setState({ allImageData });
      } else {
        this.setState({ allImageData: [] });
      }
    }
  }

  async componentDidMount() {
    this.requestImageUrls();
  }

  async componentDidUpdate(prevProps: GalleryProps) {
    if (
      this.props.selectedSource.id !== prevProps.selectedSource.id ||
      this.props.pageInfo.currentIndex !== prevProps.pageInfo.currentIndex
    ) {
      this.requestImageUrls();
    }
  }

  handleClick = (selectedImage: ImageData) => {
    this.setState({ selectedImage });
  };

  handleSubmit = () => {
    this.props.sdk.close(this.state.selectedImage);
  };

  render() {
    const { allImageData, selectedImage } = this.state;

    if (!allImageData.length) {
      return <ImagePlaceholder />;
    }

    return (
      <div>
        <div className="ix-gallery">
          {allImageData.map((imageData: any) => {
            return (
              <GridImage
                key={imageData.url}
                selected={selectedImage?.url === imageData.url}
                imageSrc={imageData.url}
                handleClick={() => this.handleClick(imageData)}
              />
            );
          })}
        </div>
        <div className="ix-gallery-footer">
          <ImagePagination
            sourceId={this.props.selectedSource.id}
            pageInfo={this.props.pageInfo}
            changePage={this.props.changePage}
          />
          <ImageSelectButton
            hidden={!!allImageData.length}
            disabled={selectedImage?.url === ''}
            handleSubmit={this.handleSubmit}
          />
        </div>
      </div>
    );
  }
}
