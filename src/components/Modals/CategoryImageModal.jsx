import React, { useEffect, useState } from 'react';
import { Modal, Form, Button, Upload, message, Card } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const CategoryImageModal = ({ 
  isVisible, 
  onCancel, 
  categoryId,
  categoryName, 
  initialImages,
  onUpdateImages 
}) => {
    
  const [form] = Form.useForm();
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);

  useEffect(() => {
    if(initialImages) {
        const imgs = initialImages?.map(img => ({
            uid: img.key,
            name: img.name,
            url: img.url,
            status: 'done',
            key: img.key
          })) || [];
        setExistingImages(imgs);
        setDeletedImages([]);
    }
  }, [initialImages]);

  const handleSubmit = async (values) => {
    const formData = new FormData();
    
    formData.append('existingImages', JSON.stringify(
      existingImages.map(img => ({
        name: img.name,
        url: img.url,
        key: img.key
      }))
    ));

    formData.append('deletedImages', JSON.stringify(
      deletedImages.map(img => ({
        name: img.name,
        url: img.url,
        key: img.key
      }))
    ));

    if (values.newImages?.fileList) {
      values.newImages.fileList.forEach((file) => {
        formData.append('images', file.originFileObj);
      });
    }

    try {
      const response = await onUpdateImages(categoryId, formData);
      if (response.success) {
        message.success('Images updated successfully');
        onCancel();
        form.resetFields();
        setDeletedImages([]);
      } else {
        message.error(response.message || 'Failed to update images');
      }
    } catch (error) {
      message.error('An error occurred while updating images');
    }
  };

  const handleDelete = (imageKey) => {
    const imageToDelete = existingImages.find(img => img.key === imageKey);
    if (imageToDelete) {
      setDeletedImages(prev => [...prev, imageToDelete]);
      setExistingImages(prev => prev.filter(img => img.key !== imageKey));
    }
  };

  return (
    <Modal
      title={`Manage Category Images - ${categoryName}`}
      open={isVisible}
      onCancel={() => {
        onCancel();
        form.resetFields();
        setExistingImages(initialImages?.map(img => ({
          uid: img.key,
          name: img.name,
          url: img.url,
          status: 'done',
          key: img.key
        })) || []);
        setDeletedImages([]);
      }}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <div className="mb-4">
          <h4 className="mb-2">Existing Images</h4>
          <div className="grid grid-cols-5 gap-2">
            {existingImages.map((image) => (
              <Card 
                key={image.key}
                size="small"
                className="overflow-hidden"
                cover={
                  <div className="relative">
                    <img
                      alt={image.name}
                      src={image.url}
                      className="h-20 w-full object-cover"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      className="absolute top-0 right-0 font-bold bg-white hover:bg-white"
                      onClick={() => handleDelete(image.key)}
                    />
                  </div>
                }
              >
                <div className="truncate text-xs" title={image.name}>
                  {image.name}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Form.Item
          name="newImages"
          label="Add New Images"
        >
          <Upload
            listType="picture-card"
            multiple
            beforeUpload={() => false}
          >
            <div>
              <UploadOutlined />
              <div className="mt-1">Upload</div>
            </div>
          </Upload>
        </Form.Item>

        <div className="flex justify-end space-x-2">
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Update Images
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CategoryImageModal;