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

  it('sets drag-active state on dragenter', () => {
    render(<ImageUpload onImagesSelected={() => {}} isProcessing={false} />);

    const dropZone = document.querySelector('[class*="border-dashed"]') as HTMLElement;
    fireEvent.dragEnter(dropZone, { dataTransfer: { files: [] } });

    expect(dropZone.className).toContain('border-blue-400');
  });

  it('sets drag-active state on dragover', () => {
    render(<ImageUpload onImagesSelected={() => {}} isProcessing={false} />);

    const dropZone = document.querySelector('[class*="border-dashed"]') as HTMLElement;
    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });

    expect(dropZone.className).toContain('border-blue-400');
  });

  it('clears drag-active state on dragleave', () => {
    render(<ImageUpload onImagesSelected={() => {}} isProcessing={false} />);

    const dropZone = document.querySelector('[class*="border-dashed"]') as HTMLElement;
    fireEvent.dragEnter(dropZone);
    fireEvent.dragLeave(dropZone);

    expect(dropZone.className).not.toContain('border-blue-400');
  });

  it('handles drop with valid image files', () => {
    const onImagesSelected = jest.fn();
    render(<ImageUpload onImagesSelected={onImagesSelected} isProcessing={false} />);

    const dropZone = document.querySelector('[class*="border-dashed"]') as HTMLElement;
    const pngFile = new File(['data'], 'menu.png', { type: 'image/png' });
    const jpegFile = new File(['data'], 'menu.jpg', { type: 'image/jpeg' });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [pngFile, jpegFile] },
    });

    expect(onImagesSelected).toHaveBeenCalledWith([pngFile, jpegFile]);
  });

  it('ignores drop with non-image files', () => {
    const onImagesSelected = jest.fn();
    render(<ImageUpload onImagesSelected={onImagesSelected} isProcessing={false} />);

    const dropZone = document.querySelector('[class*="border-dashed"]') as HTMLElement;
    const pdfFile = new File(['data'], 'menu.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropZone, { dataTransfer: { files: [pdfFile] } });

    expect(onImagesSelected).not.toHaveBeenCalled();
  });

  it('clears drag-active state after drop', () => {
    render(<ImageUpload onImagesSelected={() => {}} isProcessing={false} />);

    const dropZone = document.querySelector('[class*="border-dashed"]') as HTMLElement;
    const file = new File(['data'], 'menu.webp', { type: 'image/webp' });

    fireEvent.dragEnter(dropZone);
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

    expect(dropZone.className).not.toContain('border-blue-400');
  });
});
