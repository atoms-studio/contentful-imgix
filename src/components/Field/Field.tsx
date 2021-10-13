import { Component } from 'react';
import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { debounce } from 'lodash';
import { ImageData } from '../Gallery/ImageGallery';

import { FieldImagePreview, FieldPrompt } from './';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

interface FieldState {
  imageData: ImageData;
}

export default class Field extends Component<FieldProps, FieldState> {
  constructor(props: FieldProps) {
    super(props);

    const storedValue = this.props.sdk.field.getValue();
    
    this.state = {
      imageData: storedValue || {},
    };
  }

  openDialog = () => {
    this.props.sdk.dialogs
      .openCurrentApp({
        width: 1200,
        minHeight: 1200,
        position: 'top',
        shouldCloseOnOverlayClick: true,
        allowHeightOverflow: true,
        parameters: {
          selectedImage: this.state.imageData,
        },
      })
      .then((imageData) => 
        this.setState({ imageData }, () =>
          this.props.sdk.field.setValue({ ...imageData }),
        ),
      );
  };
  debounceOpenDialog = debounce(this.openDialog, 1000, { leading: true });

  clearSelection = () => {
    this.setState({ imageData: {} as ImageData }, () =>
      this.props.sdk.field.setValue({}),
    );
  };

  render() {
    const updateHeightHandler = this.props.sdk.window.updateHeight;
    if (this.state.imageData?.url) {
      return (
        <FieldImagePreview
          imageData={this.state.imageData}
          openDialog={this.debounceOpenDialog}
          updateHeight={updateHeightHandler}
          clearSelection={this.clearSelection}
        />
      );
    } else {
      return (
        <FieldPrompt
          openDialog={this.debounceOpenDialog}
          updateHeight={updateHeightHandler}
        />
      );
    }
  }
}
