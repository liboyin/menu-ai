import { render, fireEvent, screen } from '@testing-library/react';
import ImageUpload from './ImageUpload';

describe('ImageUpload', () => {
  it('renders the component', () => {
    render(<ImageUpload onImagesSelected={() => {}} isProcessing={false} />);
    expect(screen.getByText('Upload menu photos')).toBeInTheDocument();
    expect(screen.getByText('Choose Photos')).toBeInTheDocument();
  });

  it('calls onImagesSelected with the selected files', () => {
    const onImagesSelected = jest.fn();
    render(<ImageUpload onImagesSelected={onImagesSelected} isProcessing={false} />);

    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(onImagesSelected).toHaveBeenCalledWith([file]);
  });

  it('shows processing state', () => {
    render(<ImageUpload onImagesSelected={() => {}} isProcessing={true} />);
    expect(screen.getByText('Analyzing menu...')).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.queryByText('Choose Photos')).not.toBeInTheDocument();
  });

  it('filters out invalid file types', () => {
    const onImagesSelected = jest.fn();
    render(<ImageUpload onImagesSelected={onImagesSelected} isProcessing={false} />);

    const validFile = new File(['valid'], 'valid.png', { type: 'image/png' });
    const invalidFile = new File(['invalid'], 'invalid.txt', { type: 'text/plain' });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [validFile, invalidFile] } });

    expect(onImagesSelected).toHaveBeenCalledWith([validFile]);
  });
});
