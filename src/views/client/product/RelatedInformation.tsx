import React from 'react'
import { useParams } from 'react-router-dom';
import { useGetProductByIdQuery } from '../../../services/product.service';

const RelatedInformation = () => {
    const { _id } = useParams();
    const { data: prodetailData } = useGetProductByIdQuery(_id);
    return (
        <div>
            <div>
                <h3>Mô tả sản phẩm</h3>
                <p className="description-product">
                    <div dangerouslySetInnerHTML={{ __html: prodetailData?.content }} />
                </p>
            </div>
            {/* <div>
                
                Pop MART chính thức khai trương!!
                Chúng tôi sẽ mang đến cho bạn các hoạt động giảm giá tuyệt vời và nhiều sản phẩm giới hạn chính thức khác nhau
                Vui lòng theo dõi cửa hàng của chúng tôi để biết thông tin mới nhất
                Tất cả hàng hóa là chính thức và xác thực ~
            </div>
            <div>
                <h5>HƯỚNG DẪN BẢO QUẢN & SỬ DỤNG:</h5>
                <p className="description-product">
                    Để giày ở nơi khô ráo, thoáng mát để giữ giày được bền đẹp hơn. <br />
                    Vệ sinh giày bằng khăn hoặc bàn chải lông mềm để chải sạch. Nên sử dụng sản phẩm tẩy rửa giày chuyên dụng để vệ sinh giày.
                </p>
            </div>
            <div>
                <h5>KHUYẾN CÁO:</h5>
                <p className="description-product">
                    Không sử dụng hóa chất hay bột giặt có hoạt tính tẩy rửa mạnh. <br />
                    Không sử dụng bàn chải quá cứng để vệ sinh giày, để tránh ảnh hưởng đến chất lượng của giày. <br />
                    Tránh đi mưa ngâm nước lâu và không phơi giày trực tiếp dưới ánh nắng mặt trời mạnh.
                </p>
            </div> */}
            <div></div>
        </div>
    )
}

export default RelatedInformation
