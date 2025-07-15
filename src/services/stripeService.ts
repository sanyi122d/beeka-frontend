export const redirectToStripeCheckout = (plan: 'yearly' | 'monthly') => {
  const stripePaymentLinks = {
    yearly: 'https://buy.stripe.com/test_eVq14n3LIe8Kg2i9SxbII01',
    monthly: 'https://buy.stripe.com/test_fZu5kD3LI0hUdUa8OtbII00',
  };

  const checkoutUrl = stripePaymentLinks[plan];

  if (checkoutUrl) {
    window.location.href = checkoutUrl;
  } else {
    console.error('Invalid plan selected:', plan);
    alert('Could not find payment link for the selected plan.');
  }
}; 