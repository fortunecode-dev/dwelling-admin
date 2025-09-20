import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Clients from "./pages/Clients";
import DeletedProspects from "./pages/Clients/DeletedProspects";
import ClientForm from "./pages/Clients/ClientForm";
import MailTo from "./pages/Clients/Mailto";
import Docs from "./pages/Clients/Docs";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            {/* Auth Layout */}

            {/* <Route index path="/" element={<Home />} /> */}
            <Route index path="/clients" element={<Clients />} />
            <Route index path="/deleted-prospects" element={<DeletedProspects />} />
            <Route index path="/manage/client" element={<ClientForm />} />
            <Route index path="/mail-to" element={<MailTo />} />
            <Route index path="/files" element={<Docs />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
          </Route>

          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

        </Routes>
      </Router>
    </>
  );
}
