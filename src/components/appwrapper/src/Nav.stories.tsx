import React from 'react';
import { Nav } from './Nav';

export default {
  title: 'Components/Nav',
  component: Nav,
};

export const Default = () => {
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
  ];

  return <Nav navItems={navItems} />;
};

export const WithCustomActiveClass = () => {
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <Nav
      navItems={navItems}
      itemProps={{
        active: 'text-blue-500 font-bold',
      }}
    />
  );
};

export const WithAdditionalStyling = () => {
  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Settings', href: '/settings' },
    { name: 'Profile', href: '/profile' },
    { name: 'Logout', href: '/logout' },
  ];

  return (
    <Nav
      navItems={navItems}
      className="bg-gray-100 p-4 rounded-lg shadow-md"
      itemProps={{
        className: 'px-4 py-2 rounded hover:bg-gray-200',
      }}
    />
  );
};