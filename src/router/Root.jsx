import Layout from "../Layout/Layout";
import UserProvider from "../features/auth/UserProvider";

// Racine du routeur : le UserProvider doit vivre sous le routeur (il navigue sur un 401).
const Root = () => (
  <UserProvider>
    <Layout />
  </UserProvider>
);

export default Root;
