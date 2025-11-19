import moneyloverlogo from "../../assets/img/jpg/moneyloverver2.jpg"
import { IoLogoFacebook } from "react-icons/io";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa";

const AppFooter = () => {
    return (
        <footer className='bg-[#181818] text-white'>
            <div className='p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-xs'>
                {/* Company Info */}
                <div className="flex gap-5 lg:col-span-2 items-start">
                    <img 
                        src={moneyloverlogo} 
                        width={80} 
                        height={80}
                        className="rounded-full flex-shrink-0" 
                        alt="Money Lover ver2 Company Logo" 
                    />
                    <div className='flex flex-col gap-1'>
                        <p><strong>Company:</strong> Money Lover ver2</p>
                        <p><strong>Present:</strong> Dinh Chinh</p>
                        <p><strong>Address:</strong> Thanh Pho Ho Chi Minh</p>
                        <p><strong>Business Reg:</strong> 999-999-9999</p>
                    </div>
                </div>

                {/* Contact */}
                <div>
                    <h3 className='font-semibold mb-2'>Contact</h3>
                    <ul className='flex flex-col gap-1'>
                        <li>Phone: <a href="tel:+84775510335" className='hover:underline'>+84 338 428 459</a></li>
                        <li>Email: <a href="mailto:clothbing@gmail.com" className='hover:underline'>moneyloverver2@gmail.com</a></li>
                    </ul>
                </div>

                {/* Customer Service */}
                <div>
                    <h3 className='font-semibold mb-2'>Customer Service</h3>
                    <ul className='flex flex-col gap-1'>
                        <li>Q&A</li>
                        <li>Open: 7AM - 8PM</li>
                        <li>Contact for cooperation</li>
                    </ul>
                </div>

                {/* Social Media */}
                <div>
                    <h3 className='font-semibold mb-2'>Social Media</h3>
                    <div className='flex gap-3'>
                        <a href="https://facebook.com" aria-label="Visit our Facebook page" className='hover:text-blue-400 transition-colors'>
                            <IoLogoFacebook className='text-2xl' />
                        </a>
                        <a href="https://twitter.com" aria-label="Visit our Twitter page" className='hover:text-blue-300 transition-colors'>
                            <FaSquareXTwitter className='text-2xl' />
                        </a>
                        <a href="https://instagram.com" aria-label="Visit our Instagram page" className='hover:text-pink-400 transition-colors'>
                            <FaInstagram className='text-2xl' />
                        </a>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className='text-center py-4 border-t border-gray-700'>
                <p className='text-xs text-gray-400'>
                    Copyright © {new Date().getFullYear()} - All rights reserved by Money Lover ver2
                </p>
            </div>
        </footer>
    )
}

export default AppFooter