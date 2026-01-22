import React from 'react';
import ShopWrapper from '../../components/ShopWrapper';

const Shop = () => {
  // return <ShopWrapper productType="all" />;
  return null;
};

export async function getServerSideProps(context) {
  return {
    redirect: {
      destination: '/shop/direct-store',
      permanent: false,
    },
  }
}

export default Shop;
