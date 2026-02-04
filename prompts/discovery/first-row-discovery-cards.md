Add to discovery/page.tsx page following sections:
Add 4 cards on in the same row:
1. Discovered Applications Card
   * Show the total number of discovered applications
   * Use this Icon: import { RiCompassDiscoverLine } from "react-icons/ri";
   * Place the icon on the right corner of the card 
2. Protected Applications Card
   * Show the total number of protected applications
   * Use this Icon: import { FiShield } from "react-icons/fi";
   * The icon color should be daisyui color name: success
   * Place the icon on the right corner of the card
3. Unprotected Applications Card
   * Show the total number of unprotected applications
   * Use this Icon: import { LuShieldAlert } from "react-icons/lu";
   * The icon color should be daisyui color name: error
   * Place the icon on the right corner of the card
4. Security Events Cards
   * Show the total number of security events
   * use this Icon import { VscSymbolEvent } from "react-icons/vsc";
   * The icon color should be daisyui color name: warning
   * Place the icon on the right corner of the card