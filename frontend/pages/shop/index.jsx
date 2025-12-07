import React from 'react';
import { useRouter } from 'next/router';
import ShopWrapper from '../../components/ShopWrapper';

const Shop = () => {
  const router = useRouter();
  const { type } = router.query;

  const productType = type && ['dropship', 'affiliate'].includes(type) ? type : 'all';

  return <ShopWrapper productType={productType} />;
};

export default Shop;
