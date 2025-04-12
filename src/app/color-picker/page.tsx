import ColorPickerExample from '@/components/ColorPickerExample';

export const metadata = {
  title: 'Color Picker Demo',
  description: 'A demonstration of the standalone Color Picker component',
};

export default function ColorPickerDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Color Picker Component</h1>
      <p className="mb-6 text-gray-700">
        This page demonstrates the standalone ColorPicker component, which can be used 
        throughout the application for consistent color selection. The component supports 
        multiple configurations and can be used both inline and as a modal.
      </p>
      
      <ColorPickerExample />
    </div>
  );
} 