import React, { useEffect, useState } from "react";
import {
  useFetchOneCartQuery,
  useRemoveCartDetailMutation,
  useUpdateCartDetailMutation,
} from "../../../services/cart.service";
import {
  useGetAllProductsDetailQuery,
  useGetProductDetailQuery,
} from "../../../services/productDetail.service";
import { useGetProductsQuery } from "../../../services/product.service";
import { Button, Popconfirm, notification, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useForm } from "react-hook-form";
import ProductSale from "../home/homeProduct/ProductSale";
import EditProductModal from "./CartModel";
import { Link } from "react-router-dom";

const Cart = () => {
  const profileUser = JSON.parse(localStorage.getItem("user")!);
  const idUs = profileUser?.user;
  const [cartDetail, setCartDetail] = useState([]);
  const { data: cartUser, isLoading } = useFetchOneCartQuery(idUs);
  const { data: ProductDetailUser } = useGetAllProductsDetailQuery();
  const { data: Product } = useGetProductsQuery();
  const [removeCartDetailMutation] = useRemoveCartDetailMutation();
  const [updateCartDetailMutation] = useUpdateCartDetailMutation();
  const { data: productDetail } = useGetProductDetailQuery();
  const [productQuantities, setProductQuantities] = useState({});

  useEffect(() => {
    if (ProductDetailUser) {
      const quantities = {};
      ProductDetailUser.forEach((item) => {
        quantities[item._id] = item.quantity;
      });
      setProductQuantities(quantities);
    }
  }, [ProductDetailUser]);

  const getQuantityInStock = (productDetailId) => {
    return productQuantities[productDetailId] || 0;
  };

  const productsWithTrueStatus = cartDetail.filter(
    (product) => product.status === true
  );
  const totalCost = productsWithTrueStatus.reduce(
    (acc, product) => acc + product.quantity * product.price,
    0
  );

  useEffect(() => {
    if (cartUser && ProductDetailUser) {
      const cartDetailIds = cartUser.products.map(
        (item) => item.productDetailId
      );
      const matchingIds = cartDetailIds.filter((id) =>
        ProductDetailUser.some((product) => product._id === id)
      );

      const productIds = ProductDetailUser.map((item) => item.product_id);
      const filteredProducts = Product.filter((product) =>
        productIds.includes(product._id)
      );

      const matchingProductDetailUser = ProductDetailUser.filter((item) =>
        matchingIds.includes(item._id)
      );

      const modifiedProductDetails = matchingProductDetailUser.map((item) => {
        const matchingProduct = filteredProducts.find(
          (product) => product._id === item.product_id
        );

        if (matchingProduct) {
          const price = matchingProduct.price;
          const price_sale = matchingProduct.price_sale;
          const status = cartUser.products.find(
            (product) => product.productDetailId === item._id
          ).status;
          const cart_id = cartUser.products.find(
            (product) => product.productDetailId === item._id
          ).cart_id;
          const quantity = cartUser.products.find(
            (product) => product.productDetailId === item._id
          ).quantity;
          const idCartDetail = cartUser.products.find(
            (product) => product.productDetailId === item._id
          )._id;

          const quantityInStock = productQuantities[item._id] || 0;

          return {
            ...item,
            name: matchingProduct.name,
            image: matchingProduct.images[0],
            price: price,
            price_sale: price_sale,
            quantity: quantity,
            total: price * quantity,
            idCartDetail: idCartDetail,
            status: status,
            cart_id: cart_id,
            quantityInStock: quantityInStock,
          };
        } else {
          return item;
        }
      });

      setCartDetail(modifiedProductDetails);
    }
  }, [cartUser, ProductDetailUser, productQuantities]);

  const removeProduct = async (id) => {
    try {
      await removeCartDetailMutation(id);
      message.info({
        type: "error",
        content: "Xóa sản phẩm trong giỏ hàng thành công",
        className: "custom-class",
        style: {
          marginTop: "0",
          fontSize: "20px",
          lineHeight: "50px",
        },
      });
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm", error);
      notification.error({
        message: "Xóa",
        description: "Không thể xóa sản phẩm. Vui lòng thử lại sau.",
      });
    }
  };

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState({});
  const { control, handleSubmit, setValue, watch } = useForm();
  const [quantity, setQuantity] = useState(0);

  const setQuantityForEditingProduct = () => {
    if (editingProduct) {
      setQuantity(editingProduct.quantityInStock || 0);
    }
  };

  useEffect(() => {
    setQuantityForEditingProduct();
  }, [editingProduct]);

  const handleEditClick = (id) => {
    const productToEdit = cartDetail.find((item) => item.idCartDetail === id);
    setEditingProduct(productToEdit);
    showModal();
  };

  const showModal = () => {
    setOpen(true);
  };

  const handleOk = async () => {
    setConfirmLoading(true);
    try {
      const editedProduct = {
        _id: editingProduct._id,
        idCartDetail: editingProduct.idCartDetail,
        quantity: watch("quantity"),
      };

      if (parseInt(editedProduct.quantity, 10) > editingProduct.quantityInStock) {
        message.warning("Số lượng trong kho đã hết.");
      } else {
        await onSubmit(editedProduct);
      }

      setConfirmLoading(false);
      setOpen(false);
    } catch (error) {
      console.error("Lỗi khi xử lý", error);
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (editingProduct) {
      setValue("_id", editingProduct._id);
      setValue("color", editingProduct.color);
      setValue("idCartDetail", editingProduct.idCartDetail);
      setValue("image", editingProduct.image);
      setValue("name", editingProduct.name);
      setValue("price", editingProduct.price);
      setValue("product_id", editingProduct.product_id);
      setValue("quantity", editingProduct.quantity);
      setValue("size", editingProduct.size);
      setValue("total", editingProduct.total);
      setValue("status", editingProduct.status);
    }
  }, [editingProduct, setValue]);

  const handleQuantityChange = (event) => {
    const newQuantity = parseInt(event.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      setValue("quantity", newQuantity);
    }
  };

  const incrementQuantity = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    setValue("quantity", newQuantity);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      setValue("quantity", newQuantity);
    }
  };

  const targetProduct = ProductDetailUser?.filter(
    (item) => item.product_id === editingProduct.product_id
  );
  const selectedProductSizes = [
    ...new Set(targetProduct?.map((product) => product.size)),
  ];

  const selectedSize = watch("size");
  const selectedColor = watch("color");

  const matchingProduct = targetProduct?.find((product) => {
    return product.size === selectedSize && product.color === selectedColor;
  });

  const handleSizeChange = (newSize) => {
    setValue("size", newSize);
    const matchingColors = targetProduct
      ?.filter((product) => product.size === newSize)
      ?.map((product) => product.color);
    setValue("color", matchingColors[0]);
  };

  const onSubmit = async (cartUs) => {
    if (matchingProduct) {
      const productQuantities = {};
      const productId = matchingProduct.product_id;
      const newQuantity = parseInt(watch("quantity"), 10);

      if (newQuantity > productQuantities[productId]) {
        message.warning("Số lượng chỉnh sửa vượt quá số lượng còn lại.");
        return;
      } else {
        cartUs._id = matchingProduct._id;
        try {
          const modifiedCartDetail = {
            idCartDetail: cartUs.idCartDetail,
            productDetailId: cartUs._id,
            quantity: newQuantity,
          };
          await updateCartDetailMutation(modifiedCartDetail);
          message.info({
            type: "success",
            content: "Cập nhật giỏ hàng thành công 🎉🎉🎉",
            className: "custom-class",
            style: {
              marginTop: "0",
              fontSize: "20px",
              lineHeight: "50px",
            },
          });
        } catch (error) {
          console.error("Lỗi khi cập nhật giỏ hàng", error);
          notification.error({
            message: "Cập nhật giỏ hàng",
            description: "Không thể cập nhật giỏ hàng. Vui lòng thử lại sau.",
          });
        }
      }
    } else {
      message.warning("Sản phẩm này không tồn tại. Vui lòng kiểm tra lại.");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="flex flex-col gap-4">
        {cartDetail.length === 0 ? (
          <div>
            <h3 className="text-center my-8">
              Không có sản phẩm nào trong giỏ hàng.
              <Link to="/" className="underline hover:underline">
                Về trang chủ
              </Link>
            </h3>
          </div>
        ) : (
          cartDetail.map((item) => (
            <div className="shadow-md p-4 rounded-lg" key={item.idCartDetail}>
              <div className="grid grid-cols-4 gap-4 items-center">
                <img
                  className="w-48 rounded-md h-full"
                  src={item.image}
                  alt={item.name}
                />
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">
                      Kích thước: {item.size}
                    </span>
                    <span className="text-gray-500">
                      Màu sắc: {item.color}
                    </span>
                  </div>
                  <div className="text-orange-600 font-bold text-xl">
                    {item.price}đ
                  </div>
                  <div>
                    <p className="text-green-500">
                      Còn lại: {item.quantityInStock}
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-600 font-bold text-lg">
                      Tổng: {item.total}đ
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <button
                      className="w-6 h-6 rounded-full bg-gray-200 text-center flex justify-center items-center"
                      onClick={() => decrementQuantity(item)}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={handleQuantityChange}
                      className="w-12 h-8 text-center border rounded"
                    />
                    <button
                      className="w-6 h-6 rounded-full bg-gray-200 text-center flex justify-center items-center"
                      onClick={() => incrementQuantity(item)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Popconfirm
                    title="Xác nhận xóa sản phẩm"
                    onConfirm={() => removeProduct(item.idCartDetail)}
                    okText="Đồng ý"
                    cancelText="Hủy"
                  >
                    <Button
                      className="text-red-600"
                      icon={<CloseOutlined />}
                    />
                  </Popconfirm>
                  <Button
                    type="primary"
                    onClick={() => handleEditClick(item.idCartDetail)}
                  >
                    Chỉnh sửa
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <EditProductModal
        open={open}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        editingProduct={editingProduct}
        selectedProductSizes={selectedProductSizes}
        control={control}
        handleSizeChange={handleSizeChange}
        setValue={setValue}
        quantity={quantity}
        incrementQuantity={incrementQuantity}
        decrementQuantity={decrementQuantity}
        matchingProduct={matchingProduct}
      />
      <div className="flex justify-between items-center mt-8">
        <h3 className="text-2xl font-bold">
          Tổng số tiền: {totalCost.toLocaleString()}đ
        </h3>
        <Button type="primary" size="large">
          Thanh toán
        </Button>
      </div>
    </>
  );
};

export default Cart;
