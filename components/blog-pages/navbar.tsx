interface INavbarProps {
  userName?: string;
  userImage?: string | null;
}

export const Navbar = ({ userName, userImage }: INavbarProps) => {
  console.log("navbar userName:", userName, "userImage:", userImage);

  return <div>Navbar</div>;
};
