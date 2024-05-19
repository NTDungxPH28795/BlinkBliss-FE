import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Button, Select, Space, notification, Upload, List } from "antd";
import { useGetBrandsQuery } from "../../../services/brand.service";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "../../../services/product.service";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const { Option } = Select;

type FieldType = {
  brand_id?: string;
  name?: string;
  price?: number;
  price_sale?: number;
  description?: string;
  content?: string;
  images: string[];
};

const ProductEdit: React.FC = () => {
  const { control, handleSubmit, setValue, register } = useForm<FieldType>();
  const [updateProduct] = useUpdateProductMutation();
  const { idProduct } = useParams<{ idProduct: string }>();
  const { data: productData } = useGetProductByIdQuery(idProduct || "");
  const navigate = useNavigate();
  console.log(productData)

  const [selectedImages, setSelectedImages] = useState<string[]>(
    productData?.images || []
  );

  console.log(selectedImages)


  useEffect(() => {
    if (productData) {
      Object.keys(productData).forEach((key) => {
        setValue(key as keyof FieldType, productData[key]);
      });
      console.log("Product Images:", productData?.images);
      setSelectedImages(productData?.images)
    }
  }, [productData, setValue]);

  const handleImageChange = async (file: File) => {
    try {
      const data = new FormData();
      const cloudName = "ddbdu6zip"; // Thay bằng cloud_name của bạn
      const uploadPreset = "vithoang"; // Thay bằng upload_preset của bạn

      data.append("file", file);
      data.append("upload_preset", uploadPreset);
      data.append("cloud_name", cloudName);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        data
      );

      const imageUrl = response.data.secure_url;

      setSelectedImages((prevImages) => [...prevImages, imageUrl]);
      setValue("images", [...selectedImages, imageUrl]);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setSelectedImages((prevImages) =>
      prevImages.filter((image) => image !== imageUrl)
    );
  };

  // description
  const [description1, setDescription] = useState(""); 
  useEffect(() => {
    if (productData && productData.description) {
      setDescription(productData.description);
    }
  }, [productData]);

  // description
  const [content1 , setContent] = useState(""); 
  useEffect(() => {
    if (productData && productData.content) {
      setContent(productData.content);
    }
  }, [productData]);

  const onSubmit: SubmitHandler<FieldType> = async (data) => {
    try {
      console.log("Images before update:", selectedImages);
      const newImageUrls = await Promise.all(
        selectedImages.map(async (image) => {
          if (image.includes("cloudinary")) {
            return image;
          }

          const data = new FormData();
          const cloudName = "ddbdu6zip"; // Thay bằng cloud_name của bạn
          const uploadPreset = "vithoang"; // Thay bằng upload_preset của bạn

          data.append("file", image);
          data.append("upload_preset", uploadPreset);
          data.append("cloud_name", cloudName);

          const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            data
          );

          return response.data.secure_url;
        })
      );

      const updatedValues = { ...data, images: newImageUrls , description:description1 , content:content1 };
      await updateProduct({ ...updatedValues, _id: idProduct }).unwrap();

      notification.success({
        message: "Success",
        description: "Sửa Sản Phẩm Thành Công!",
      });

      navigate("/admin/product");
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  return (
    <div className="container-xxl">
      <div className="row">
        <div className="col-md-12">
          <div className="card custom-card">
            <div className="card-body">
              <h5 className="card-title fw-semibold add-new p-4 border-1 mb-4">Sửa Sản Phẩm</h5>
              <form onSubmit={handleSubmit(onSubmit)} className="row">
                <div className="form-group col-md-8 col-sm-12">
                  <label>Tên sản phẩm</label>
                  <input
                    {...register("name", { required: true })}
                    className={`form-control`}
                  />
                </div>
                <div className="form-group col-md-4 col-sm-12">
                  <label>Danh Mục</label>
                  <Controller
                    name="brand_id"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Thương Hiệu"
                        className="form-control"
                      >
                        {useGetBrandsQuery()?.data?.map((brand) => (
                          <Option key={brand._id} value={brand._id}>
                            {brand.name}
                          </Option>
                        ))}
                      </Select>
                    )}
                  />
                </div>
                <div className="form-group col-md-6 col-sm-12">
                  <label>Giá niêm yết</label>
                  <input
                    {...register("price", { required: true })}
                    type="number"
                    className={`form-control`}
                  />
                </div>

                <div className="form-group col-md-6 col-sm-12">
                  <label>Giá bán</label>
                  <input
                    {...register("price_sale", { required: true })}
                    type="number"
                    className={`form-control`}
                  />
                </div>
                <div className="form-group">
                  <label>Ảnh</label>
                  <Upload
                    listType="picture-card"
                    fileList={selectedImages.map((url, index) => ({
                      uid: String(index),
                      status: 'done',
                      url: url,
                    }))}
                    beforeUpload={(file) => {
                      handleImageChange(file);
                      return false; // Prevent automatic upload
                    }}
                    onRemove={(file) => handleRemoveImage(file.url as string)}
                    multiple // Enable multiple file selection
                  >
                    <div>
                      <i className="bx bx-image-add"></i> Upload ảnh
                    </div>
                  </Upload>
                </div>
                <div className="App">
                  <label>Mô tả ngắn</label>
                  <CKEditor
                    editor={ClassicEditor}
                    data={description1} // Sử dụng giá trị của state "description"
                    onReady={(editor) => {
                      // console.log("Editor is ready to use!", editor);
                    }}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      setDescription(data); 
                    }} 
                    onBlur={(event, editor) => {
                      // console.log("Blur.", editor);
                    }}
                    onFocus={(event, editor) => {
                      // console.log("Focus.", editor);
                    }}
                  />
                </div>

                <div className="App">
                <label>Nội dung</label>
                  <CKEditor
                    editor={ClassicEditor}
                    data={content1}
                    onReady={(editor) => {
                      // console.log("Editor is ready to use!", editor);
                    }}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      setContent(data); 
                    }} 
                    onBlur={(event, editor) => {
                      // console.log("Blur.", editor);
                    }}
                    onFocus={(event, editor) => {
                      // console.log("Focus.", editor);
                    }}
                  />
                </div>

                <div className="form-group">
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Cập nhật
                    </Button>
                    <Button
                      type="primary"
                      danger
                      onClick={() => navigate("/admin/product")}
                      className="ml-2"
                    >
                      Quay lại
                    </Button>
                  </Space>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;
