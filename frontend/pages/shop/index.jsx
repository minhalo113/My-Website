
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/shop/direct-store',
      permanent: false,
    },
  };
}

const Shop = () => {
  return null;
};

export default Shop;
