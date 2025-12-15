import upload_area from "./upload_area.svg"
import hero_model from "./hero_model.png"
import { ClockFadingIcon, HeadsetIcon, SendIcon } from "lucide-react";
import tshirt_white_front from "./tshirt_white_front.png"
import tshirt_white_back from "./tshirt_white_back.png"
import tshirt_black_front from "./tshirt_black_front.png"
import tshirt_black_back from "./tshirt_black_back.png"
import hoodie_white_front from "./hoodie_white_front.png"
import hoodie_white_back from "./hoodie_white_back.png"
import tshirt_blue_front from "./tshirt_blue_front.png"
import tshirt_blue_back from "./tshirt_blue_back.png"
import tshirt_red_front from "./tshirt_red_front.png"
import tshirt_red_back from "./tshirt_red_back.png"

export const assets = {
    upload_area, hero_model,
    tshirt_white_front, tshirt_white_back,
    tshirt_black_front, tshirt_black_back,
    hoodie_white_front, hoodie_white_back,
    tshirt_blue_front, tshirt_blue_back,
    tshirt_red_front, tshirt_red_back,
}

// export const categories = ["Headphones", "Speakers", "Watch", "Earbuds", "Mouse", "Decoration"];

export const ourSpecsData = [
    { title: "Free Shipping", description: "Enjoy fast, free delivery on every order no conditions, just reliable doorstep.", icon: SendIcon, accent: '#05DF72' },
    { title: "7 Days easy Return", description: "Change your mind? No worries. Return any item within 7 days.", icon: ClockFadingIcon, accent: '#FF8904' },
    { title: "24/7 Customer Support", description: "We're here for you. Get expert help with our customer support.", icon: HeadsetIcon, accent: '#A684FF' }
]