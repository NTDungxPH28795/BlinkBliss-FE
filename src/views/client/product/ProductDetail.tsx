import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  useGetProductByIdQuery,
  useGetProductsQuery,
} from "../../../services/product.service";
import { useGetBrandsQuery } from "../../../services/brand.service";
import {
  useGetAllProductsDetailQuery,
  useGetAllsProductsDetailQuery,
} from "../../../services/productDetail.service";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Tabs, message as messageApi, Space, Alert } from "antd";
import CommentProductDetail from "./CommentProductDetail";
import { useCreateCartMutation } from "../../../services/cart.service";
import ProductLienQuan from "./ProductLienQuan";
import ProductSale from "../home/homeProduct/ProductSale";
import RelatedInformation from "./RelatedInformation";

const { TabPane } = Tabs;


const ProductDetail = () => {
  const { data: productData } = useGetProductsQuery();
  const [dataSourceToRender, setDataSourceToRender] = useState([]);
  useEffect(() => {
    if (productData) {
      const updatedDataSource = productData.map((product) => ({
        ...product,
      }));
      setDataSourceToRender(updatedDataSource);
    }
  }, [productData]);

  const { data: brandData } = useGetBrandsQuery();
  const { _id } = useParams();
  const { data: prodetailData } = useGetProductByIdQuery(_id);

  console.log(prodetailData);


  const brandName = brandData?.find(
    (brand) => brand._id === prodetailData?.brand_id
  )?.name;
  const { data: productDataDetail, isLoading } = useGetAllsProductsDetailQuery(_id);

  console.log(productDataDetail);

  const [productSizes, setProductSizes] = useState([]);
  useEffect(() => {
    if (productDataDetail) {
      // Kiểm tra xem productDataDetail có tồn tại và không rỗng
      // Lấy giá trị của size từ productDataDetail và gán vào productSizes
      const sizes = productDataDetail.map((product: any) => product.size);
      setProductSizes(sizes);
    }
  }, [productDataDetail]); // Sử dụng mảng dependency để theo dõi sự thay đổi của productDataDetail

  // console.log(productSizes); // In ra productSizes để kiểm tra kết quả

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(prodetailData?.images[0]);
  const [remainingQuantity, setRemainingQuantity] = useState<number | null>(
    null
  );
  const [quantityError, setQuantityError] = useState(null);
  // const [errorDisplayed, setErrorDisplayed] = useState(false);
  const [totalQuantityForSelectedSize, setTotalQuantityForSelectedSize] = useState(null);
  // const [quantityForColorsInSelectedSize, setQuantityForColorsInSelectedSize] = useState({});
  const [sizeError, setSizeError] = useState(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);

  const [productdeID, setproductdeID] = useState();

  useEffect(() => {
    if (selectedSize && productDataDetail) {
      // Lọc ra các phần tử trong productDataDetail có size bằng selectedSize
      const productsWithSelectedSize = productDataDetail.filter(
        (detail: any) => detail.size === selectedSize
      );

      // Lặp qua từng phần tử và log id của chúng
      productsWithSelectedSize.forEach((product: any) => {
        setproductdeID(product._id)
        console.log("ID của sản phẩm có size", selectedSize, " là:", product._id);
      });
    }
  }, [selectedSize, productDataDetail]);

  console.log(productdeID);

  useEffect(() => {
    if (selectedSize) {
      const totalQuantityForSize = productDataDetail
        ?.filter((detail: any) => detail?.size === selectedSize)
        .reduce((total: any, detail: any) => total + detail.quantity, 0);
      setTotalQuantityForSelectedSize(totalQuantityForSize);
    }
  }, [selectedSize, productDataDetail]);

  const handleThumbnailClick = (image: any) => {
    setMainImage(image);
  };

  const handleSizeChange = (size: any) => {
    setSelectedSize(size);
    setRemainingQuantity(calculateRemainingQuantity(size));
  };

  const calculateRemainingQuantity = (size: any) => {
    const selectedSizeDetail = productDataDetail?.find(
      (detail: any) => detail?.size === size
    );

    return Math.max(selectedSizeDetail?.quantity || 0);
  };

  useEffect(() => {
    if (selectedSize) {
      setQuantityError(null);
    }
  }, [selectedSize]);

  useEffect(() => {
    if (!quantityError && isErrorVisible) {
      setIsErrorVisible(false);
    }
  }, [quantityError, quantity]);

  const handleQuantityChange = (event: any) => {
    const newQuantity = parseInt(event.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      setQuantityError("");
      setQuantity(newQuantity);
      setIsErrorVisible(false);
    } else {
      setQuantityError("Số lượng không hợp lệ");
      setIsErrorVisible(true);
    }
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const profileUser = JSON.parse(localStorage.getItem("user"))?.user;
  const [addCart] = useCreateCartMutation();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Tìm productDataDetail có size trùng với size của cartItem
  // const matchedProduct = productDataDetail.find((item:any) => item.size === selectedSize);



  const onSubmitCart = async () => {
    if (profileUser) {
      if (!isAddingToCart) {
        if (!selectedSize) {
          messageApi.error({
            type: "error",
            content:
              "Vui lòng chọn kích cỡ trước khi thêm vào giỏ hàng !!!",
            className: "custom-class",
            style: {
              margin: "10px",
              fontSize: "20px",
              lineHeight: "30px",
            },
          });
          return;
        }
        if (quantity > remainingQuantity) {
          setSizeError(null);
          setQuantityError(
            `Chỉ còn ${remainingQuantity} sản phẩm. Vui lòng chọn số lượng nhỏ hơn hoặc bằng.`
          );
          return;
        } else if (remainingQuantity === 0) {
          setQuantityError("Sản phẩm đã hết ");
        } else {
          setQuantityError(null);
        }

        setIsAddingToCart(true);
        const cartItem = {
          product_id: prodetailData._id,
          deIDproduct: productdeID,
          user_id: profileUser,
          quantity: quantity,
        };
        const result = await addCart(cartItem);
        const successMessage = `Thêm sản phẩm vào trong giỏ hàng thành công 🎉🎉🎉`;
        messageApi.success({
          type: "success",
          content: successMessage,
          className: "custom-class",
          style: {
            margin: "10px",
            fontSize: "20px",
            lineHeight: "30px",
          },
        });
        setIsAddingToCart(false);
      }
    } else {
      messageApi.error({
        type: "error",
        content: "Vui lòng đăng nhập để thực hiện chức năng này !!!",
        className: "custom-class",
        style: {
          margin: "10px",
          fontSize: "20px",
          lineHeight: "30px",
        },
      });
    }
  };

  const sliderSettings = {
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  if (isLoading) {
    return (
      <div>
        <div className="right-wrapper">
          <div className="spinnerIconWrapper">
            <div className="spinnerIcon"></div>
          </div>
          <div className="finished-text">Xin vui lòng chờ một chút 🥰🥰🥰</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="product_image_area">
        <div className="container">
          <div className="row s_product_inner">
            <div className="col-lg-5 offset-lg-1">
              <div className="single-prd-item">
                <img
                  className="img-fluid w-[100px] "
                  src={mainImage || prodetailData?.images[0]}
                  alt=""
                  style={{ border: "1px solid #000" }}
                />
              </div>
              <Slider {...sliderSettings}>
                <div className="image-carosell d-flex p-2 mt-3">
                  {prodetailData?.images?.map((item: any) => (
                    <div
                      className="single-prd-item col-3 p-2"
                      key={item}
                      onClick={() => handleThumbnailClick(item)}
                    >
                      <img
                        className="img-fluid h-100"
                        src={item}
                        alt=""
                        style={{
                          border: "1px solid #000",
                          width: "100px",
                          height: "100px",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </Slider>
            </div>
            <div className="col-lg-5 offset-lg-1">
              <div className="s_product_text">
                <h3>{prodetailData?.name}</h3>
                {prodetailData?.price_sale > 0 ? (
                  <div className="product-price row">
                    <strong className="col-12">
                      {prodetailData?.price_sale?.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </strong>
                    <div className="d-flex">
                      <del className="price-del">
                        {prodetailData?.price?.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </del>
                    </div>
                  </div>
                ) : (
                  <div className="product-price row">
                    <strong className="col-12">
                      {prodetailData?.price?.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </strong>
                  </div>
                )}
                <ul className="list">
                  <li>
                    <a className="active" href="#">
                      <span>Thương Hiệu</span> : {brandName}
                    </a>
                  </li>
                  <hr />
                  <li>
                    <i>{prodetailData?.description}</i>
                  </li>
                </ul>

                <div className="product-blocks-details product-blocks-443 grid-rows">
                  <div className="grid-row grid-row-443-1">
                    <div className="grid-cols">
                      <div className="grid-col grid-col-443-1-1">
                        <div className="grid-items">
                          <div className="grid-item grid-item-443-1-1-1">
                            <div className="module module-info_blocks module-info_blocks-361">
                              <div className="module-body">
                                <div className="module-item module-item-1 info-blocks info-blocks-icon">
                                  <div className="info-block">
                                    <div className="info-block-content">
                                      <div className="info-block-title">
                                        MỌI THẮC MẮC VUI LÒNG LIÊN HỆ ZALO : 0988328867
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="product-detail  size">
                  <p>Kích Cỡ</p>
                  <div className="size-buttons">
                    {productSizes?.map((size, index) => (
                      <button
                        key={index}
                        className={`size-button ${selectedSize === size ? "active" : ""
                          }`}
                        onClick={() => handleSizeChange(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  {/* <div className="remaining-quantity mt-3">
                    <p>
                      {selectedSize &&
                        `Tổng số lượng sản phẩm cho loại
                         ${selectedSize}: ${totalQuantityForSelectedSize !== null
                          ? totalQuantityForSelectedSize
                          : "Loading..."
                        }`}
                      {quantityError && (
                        <Alert type="error" message={quantityError} showIcon />
                      )}
                    </p>
                  </div> */}
                  {quantityError && (
                    <div className="quantity-error mt-3">
                      <p style={{ color: "red" }}>{quantityError}</p>
                    </div>
                  )}
                </div>

                <div className="product_count flex-1">
                  <label className="quantity">Số Lượng:</label>
                  <div className="quantity-input">
                    <span>
                      <button onClick={decrementQuantity}>-</button>
                    </span>
                    <input
                      min="1"
                      maxLength={10}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-50"
                    />
                    <span>
                      <button onClick={incrementQuantity}>+</button>
                    </span>
                  </div>
                </div>
                <div className="card_area d-flex align-items-center">
                  <button
                    className="primary-btn"
                    onClick={onSubmitCart}
                    disabled={isAddingToCart}
                  >
                    {isAddingToCart
                      ? "Thêm vào giỏ hàng..."
                      : "Thêm vào giỏ hàng"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Tabs defaultActiveKey="1" className="container">
          <TabPane tab="Thông tin liên quan" key="1">
            <RelatedInformation />
          </TabPane>
          <TabPane tab="Xem đánh giá " key="2">
            <CommentProductDetail />
          </TabPane>
        </Tabs>
        <ProductLienQuan />
        {/* <ProductSale /> */}
      </div>
      <div></div>
    </div>
  );
};

export default ProductDetail;
