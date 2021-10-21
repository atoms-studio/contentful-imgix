import { Component, FormEvent } from 'react';
import ImgixAPI, { APIError } from 'imgix-management-js';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';
import { TextInput, Button, SkeletonContainer, SkeletonImage } from '@contentful/forma-36-react-components';
import { debounce } from 'lodash';

import { SourceProps, PageProps } from '../Dialog';
import { ImageSelectButton } from '../ImageSelect/ImageSelect';
import { GridImage, ImagePlaceholder, ImagePagination } from './';

import './ImageGallery.css';

const getSkeletons = (): any[] => {
  return new Array(18).fill(() => 1).map((_, i) => 
    <SkeletonContainer>
      <SkeletonImage width={150} height={150} key={'skeleton-' + i} />
    </SkeletonContainer>
  );
}
interface GalleryProps {
  selectedSource: Partial<SourceProps>;
  imgix: ImgixAPI;
  sdk: DialogExtensionSDK;
  getTotalImageCount: (totalImageCount: number, isFiltering: boolean) => void;
  pageInfo: PageProps;
  changePage: (newPageIndex: number) => void;
}

export interface ImageData {
  url: string;
  details: Details;
  fileName: string;
  contentType: string;
  path: string;
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
  fullUrls: Array<Record<string, string>>;
  query: string;
  loading: boolean;
  allImageData: ImageData[];
  selectedImage: ImageData;
}
export class Gallery extends Component<GalleryProps, GalleryState> {
  constructor(props: GalleryProps) {
    super(props);

    this.state = {
      fullUrls: [],
      query: '',
      loading: false,
      allImageData: [],
      selectedImage: {} as ImageData,
    };
  }

  getImages = async () => {
    let url = `assets/${this.props.selectedSource?.id}?page[number]=${this.props.pageInfo.currentIndex}&page[size]=18`
    let isFiltering = false
    if (this.state.query) {
      isFiltering = true
      url += `&filter[or:categories]=${this.state.query}&filter[or:keywords]=${this.state.query}&filter[or:origin_path]=${this.state.query}`
    }
    const assets = await this.props.imgix.request(url);
    // TODO: add more explicit types for image
    this.props.getTotalImageCount(
      parseInt((assets.meta.cursor as any).totalRecords || 0),
      isFiltering,
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
            contentType: image.attributes.content_type,
            path: image.attributes.origin_path,
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

    return scheme + domain + imgixDomain + path
  }

  /*
   * Requests and constructs fully-qualified image URLs, saving the results to
   * state
   */
  async requestImageUrls() {
    // if selected source, return images
    if (Object.keys(this.props.selectedSource).length) {
      this.setState({ loading: true })
      const allImageData = await this.getImagesData();
      // if at least one path, remove placeholders

      if (allImageData.length) {
        this.setState({ allImageData });
      } else {
        this.setState({ allImageData: [] });
      }
      this.setState({ loading: false })
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

  debounceSearch = debounce(() => {
    this.requestImageUrls()
  }, 1000);

  handleChange = (event: FormEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement
    this.setState({ query: target.value });

    this.debounceSearch();
  }

  render() {
    const { allImageData, selectedImage, query, loading } = this.state;

    if (!this.props.selectedSource || (!allImageData.length && !query && !loading)) {
      return <ImagePlaceholder />;
    }

    return (
      <div>
        <div className="ix-gallery-header">
          <TextInput name="ix-search-query" value={query} placeholder="Search by filename, path, tag, or category" onChange={this.handleChange} />

          <div className="ix-upload-wrap">
            <Button
                size="small"
                icon="Plus"
                buttonType="primary"
              >
                Upload
              </Button>
          </div>
        </div>
        <div className="ix-gallery">
          { loading ? getSkeletons() : allImageData.map((imageData: ImageData) => {
            return (
              <GridImage
                key={imageData.url}
                selected={selectedImage?.url === imageData.url}
                imageSrc={imageData.url}
                path={imageData.path}
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
