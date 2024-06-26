import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Select, Table, Tag, Space, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  useFetchCheckoutQuery,
  useIncreaseProductMutation,
  useUpdateCheckoutMutation,
} from "../../../services/checkout.service";
import OrderDetails from "./OrderDetails";
import { message as messageApi } from "antd";

const OrderMane: React.FC = () => {
  /////// modal chi tiết
  const [open, setOpen] = useState(false);
  const showModal = () => {
    setOpen(true);
  };
  const hideModal = () => {
    setPreviousStatus(null);
    setOpen(false);
  };
  // model hủy hàng
  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const setOrderDa = (updatedOrderDa) => {
    setRoleMane(updatedOrderDa);
  };

  const { data: orderDa, isLoading, isFetching } = useFetchCheckoutQuery();
  const [updateCheck] = useUpdateCheckoutMutation();
  const [roleMane, setRoleMane] = useState<any>({});
  const [increaseProduct] = useIncreaseProductMutation();
  const [searchResult, setSearchResult] = useState<any>([]);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined
  );

  const handleEditClick = (id: string) => {
    const productToEdit = orderDa?.find((item) => item?._id === id);
    setRoleMane(productToEdit);
    setPreviousStatus(productToEdit?.status);
    showModal();
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchFullName, setSearchFullName] = useState<string | undefined>(
    undefined
  );

  const handleFullNameSearchChange = (value: string) => {
    setSearchFullName(value.toLowerCase());
  };
  const [searchID, setSearchID] = useState<string | undefined>(undefined);

  const handleIDSearchChange = (value: string) => {
    setSearchID(value.toLowerCase());
  };

  const nonSuccessfulOrder = orderDa?.map((order: any, index: number) => {
    const date = new Date(order?.dateCreate)?.toLocaleDateString("en-US");
    const totals = order.products.reduce(
      (acc: number, product: any) => acc + (product.total || 0),
      0
    );
    return {
      ...order,
      index: index + 1,
      date: date,
      totals,
    };
  });

  const onSearch = (value: string) => {
    if (value === "") {
      setSearchResult(nonSuccessfulOrders);
    } else {
      let filteredData = nonSuccessfulOrders;
      filteredData = filteredData?.filter((item: any) => {
        return item?.status === value;
      });

      // Ẩn trạng thái "Đang xác nhận đơn hàng" khi chọn "Tiếp nhận đơn hàng"
      if (value === "Tiếp nhận đơn hàng") {
        filteredData = filteredData.filter(
          (item: any) => item?.status !== "Đang xác nhận đơn hàng"
        );
      }

      if (filteredData?.length === 0) {
        messageApi.error({
          type: "error",
          content: "Không có đơn hàng nào trạng thái này",
          className: "custom-class",
          style: {
            marginTop: "0",
            fontSize: "15px",
            lineHeight: "50px",
          },
        });
      }
      setSearchResult(filteredData);
    }
  };

  const [cancellationOrderId, setCancellationOrderId] = useState<string | null>(
    null
  );
  const [cancellationOrderStatus, setCancellationOrderStatus] = useState<
    string | null
  >(null);

  const nonSuccessfulOrders = nonSuccessfulOrder
    ?.filter(
      (order: any) =>
        order.status !== "Giao hàng thành công" &&
        order.status !== "Hủy đơn hàng"
    )
    ?.filter(
      (order) =>
        !searchFullName || order.fullName.toLowerCase().includes(searchFullName)
    )
    ?.filter((order) => !searchID || order._id.toLowerCase().includes(searchID))
    ?.sort(
      (a, b) =>
        new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime()
    )
    ?.map((order, index) => ({ ...order, index: index + 1 }));

  const onFinish = async (values: any, id: string) => {
    try {
      const updatedData = {
        _id: id,
        status: values.status,
      };
      if (values.status === "Giao hàng thành công") {
        messageApi.success({
          type: "success",
          content: "Đơn hàng đã được giao thành công 🎉🎉🎉",
          className: "custom-class",
          style: {
            marginTop: "0",
            fontSize: "15px",
            lineHeight: "50px",
          },
        });
        await updateCheck(updatedData).unwrap();
      } else if (values.status === "Hủy đơn hàng") {
        setIsModalOpen(true);
        setCancellationOrderId(id);
        setCancellationOrderStatus(values?.status);
      } else {
        messageApi.success({
          type: "error",
          content: "Cập nhật trạng thái đơn hàng thành công 🎉🎉🎉",
          className: "custom-class",
          style: {
            marginTop: "0",
            fontSize: "15px",
            lineHeight: "50px",
          },
        });
        await updateCheck(updatedData).unwrap();
      }

      // Cập nhật lại danh sách đơn hàng sau khi cập nhật thành công
      const updatedOrderDa = orderDa?.map((order) =>
        order._id === id ? { ...order, status: values.status } : order
      );
      setOrderDa(updatedOrderDa);

      hideModal();
    } catch (error) {
      console.error("Error updating checkout status:", error);
    }
  };

  // modal xóa
  const onFinish1 = (value: any) => {
    const orderId = cancellationOrderId;
    const increase = orderDa?.find((item: any) => item?._id === orderId);
    const noteDe = {
      _id: orderId,
      noteCancel: value?.note,
      status: cancellationOrderStatus,
    };
    increase?.products.map((item: any) => increaseProduct(item));
    updateCheck(noteDe).unwrap();
    setIsModalOpen(false);
    messageApi.error({
      type: "error",
      content: "Đơn hàng đã bị hủy ",
      className: "custom-class",
      style: {
        marginTop: "0",
        fontSize: "15px",
        lineHeight: "50px",
      },
    });
  };
  // bảng dữ liệu
  if (isLoading) {
    return (
      <div>
        <div className="right-wrapper" style={{ paddingTop: "100px" }}>
          <div className="spinnerIconWrapper">
            <div className="spinnerIcon"></div>
          </div>
          <div className="finished-text">Xin vui lòng chờ một chút 🥰🥰🥰</div>
        </div>
      </div>
    );
  }
  const columns: ColumnsType<any> = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "_id",
      key: "_id",
      render: (_id) => <a>{_id}</a>,
    },
    {
      title: "Tên người nhận",
      dataIndex: "fullName",
      key: "fullName",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Tổng tiền đơn hàng",
      dataIndex: "total",
      key: "total",
      render: (_, { total }) => (
        <>
          <Tag
            className="py-1"
            style={{ display: "flex", justifyContent: "center" }}
          >
            {total?.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
          </Tag>
        </>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (_, { status, _id }) => (
        <>
          <Form
            name="complex-form"
            onFinish={(values) => onFinish(values, _id)}
            initialValues={{ status: status }}
            style={{ display: "flex", justifyContent: "right" }}
          >
            <Form.Item label="">
              <Space.Compact>
                {previousStatus && <Tag color="default">{previousStatus}</Tag>}
                <Form.Item
                  name={"status"}
                  noStyle
                  rules={[{ required: true, message: "Province is required" }]}
                >
                  <Select
                    placeholder="Select province"
                    style={{ width: "250px" }}
                  >
                    {status !== "Tiếp nhận đơn hàng" &&
                      status !== "Đã giao cho đơn vị vận chuyển" &&
                      status !== "Đang giao hàng" && (
                        <Select.Option value="Đang xác nhận đơn hàng">
                          Đang xác nhận đơn hàng
                        </Select.Option>
                      )}

                    {status !== "Đã giao cho đơn vị vận chuyển" &&
                      status !== "Đang giao hàng" && (
                        <Select.Option value="Tiếp nhận đơn hàng">
                          Tiếp nhận đơn hàng
                        </Select.Option>
                      )}
                    {status !== "Đang giao hàng" && (
                      <Select.Option value="Đã giao cho đơn vị vận chuyển">
                        Đã giao cho đơn vị vận chuyển
                      </Select.Option>
                    )}
                    {status !== "Giao hàng thành công" && (
                      <Select.Option value="Đang giao hàng">
                        Đang giao hàng
                      </Select.Option>
                    )}

                    <Select.Option value="Giao hàng thành công">
                      Giao hàng thành công
                    </Select.Option>

                    <Select.Option value="Hủy đơn hàng">
                      Hủy đơn hàng
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Space.Compact>
            </Form.Item>
            <Form.Item label=" " colon={false}>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
            </Form.Item>
          </Form>
        </>
      ),
    },
    {
      title: "Ngày mua hàng",
      dataIndex: "date",
      key: "date",
      render: (date: any) => <span className="container">{date}</span>,
    },
    {
      title: "Action",
      dataIndex: "",
      key: "action",
      render: (record: any) => (
        <span>
          <Button type="primary" onClick={() => handleEditClick(record?._id)}>
            Xem Chi Tiết
          </Button>
          {/* </Link> */}
        </span>
      ),
    },
  ];

  return (
    <div style={{ paddingTop: "70px" }}>
      <Input
        placeholder="Search by mã đơn hàng"
        style={{ width: 400, marginBottom: 16, marginLeft: 30 }}
        onChange={(e) => handleIDSearchChange(e.target.value)}
      />
      <Input
        placeholder="Search by full name"
        style={{ width: 400, marginBottom: 16, marginLeft: 30 }}
        onChange={(e) => handleFullNameSearchChange(e.target.value)}
      />
      <Select
        style={{ width: 300, margin: 16 }}
        placeholder="Chọn trạng thái"
        onChange={onSearch}
        options={[
          { value: "", label: "All" },
          { value: "Đang xác nhận đơn hàng", label: "Đang xác nhận đơn hàng" },
          { value: "Tiếp nhận đơn hàng", label: "Tiếp nhận đơn hàng" },
          {
            value: "Đã giao cho đơn vị vận chuyển",
            label: "Đã giao cho đơn vị vận chuyển",
          },
          { value: "Đang giao hàng", label: "Đang giao hàng" },
        ]}
      />
      <Table
        columns={columns}
        dataSource={
          searchResult.length > 0 ? searchResult : nonSuccessfulOrders
        }
      />
      {/* modal chi tiết hàng */}
      <Modal
        title="Chi tiết đơn hàng"
        open={open}
        onOk={hideModal}
        onCancel={hideModal}
        okText="ok"
        cancelText="cancel"
        width={1000}
        style={{ top: 20 }}
      >
        <OrderDetails roleMane={roleMane} />
      </Modal>
      {/* modal hủy hàng */}

      <Modal
        title="Lý do hủy đơn hàng"
        open={isModalOpen}
        onOk={onFinish1}
        onCancel={handleCancel}
      >
       

        <Form
          name="nest-messages"
          onFinish={onFinish1}
          style={{ maxWidth: 600, paddingTop: 60, paddingBottom: 20 }}
        >
          <Form.Item
            name={"note"}
            rules={[
              {
                required: true,
                message: "Please enter the reason for cancellation!",
              },
            ]}
          >
            <Input.TextArea
              rows={6}
              placeholder="Nhập lý do hủy đơn hàng ..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderMane;