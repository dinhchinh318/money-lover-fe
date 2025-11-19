import { Link, useNavigate } from "react-router";
import { Button, Form, Input, message } from "antd";
import { registerAPI } from "../../../services/api.user";
import { useEffect, useRef, useState } from "react";
const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current.focus();
  }, []);
  const onFinish = async (values) => {
    setLoading(true);
    const { name, email, password, phone } = values;
    const res = await registerAPI(name, email, password, phone);
    if (res?.data) {
      message.success("Register successfully!");
      navigate("/login");
    } else {
      message.error("Register failed!");
    }
    setLoading(false);
  };
  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };
  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-3 max-sm:grid-cols-1 max-xl:block max-xl:w-[60%] max-xl:m-auto max-sm:w-full p-8">
        <div className="max-lg:hidden"></div>
        <div className="flex flex-col items-center border-2 rounded-2xl p-4 bg-[#fff]">
          <label className="font-bold text-2xl pt-8 text-[#000]" htmlFor="">
            Register
          </label>
          <Form
            name="basic"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600, width: "100%", paddingTop: "50px" }}
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label={<span className="font-bold">Name</span>}
              name="name"
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
            >
              <Input ref={inputRef} />
            </Form.Item>

            <Form.Item
              label={<span className="font-bold">Email</span>}
              name="email"
              rules={[{ required: true, message: "Please input your email!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={<span className="font-bold">Password</span>}
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label={<span className="font-bold">Phone</span>}
              name="phone"
              rules={[{ required: true, message: "Please input your phone!" }]}
            >
              <Input />
            </Form.Item>
            <div className="flex justify-center">
              <Button loading={loading} type="primary" htmlType="submit">
                <span>Submit</span>
              </Button>
            </div>
            <div className="flex justify-center gap-2 p-4">
              <span>Have an account?</span>
              <Link className="underline cursor-pointer" to="/login">
                Sign in here
              </Link>
            </div>
          </Form>
        </div>
        <div className="max-lg:hidden"></div>
      </div>
    </div>
  );
};
export default Register;
