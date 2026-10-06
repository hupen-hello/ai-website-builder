'use client';
import React from 'react';
import { HeaderData, TopBarData } from './applianceTypes';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FiMail, FiPhone } from 'react-icons/fi';

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'FaFacebookF': return <FaFacebookF />;
    case 'FaXTwitter': return <FaXTwitter />;
    case 'FaInstagram': return <FaInstagram />;
    case 'FaLinkedinIn': return <FaLinkedinIn />;
    default: return null;
  }
};

export const TopBar = ({ data, logoData }: { data?: TopBarData; logoData?: HeaderData }) => {
  return null;
};
