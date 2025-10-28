import React from 'react'
import { Routes, Route } from 'react-router-dom'
import styled from 'styled-components'

import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ComicReader from './pages/ComicReader'
import CreatorStudio from './pages/CreatorStudio'
import Profile from './pages/Profile'
import Collection from './pages/Collection'
import ComicDetail from './pages/ComicDetail'
import NotFound from './pages/NotFound'

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${(props: any) => props.theme.colors?.background};
  color: ${(props: any) => props.theme.colors?.text};
`

const MainContent = styled.main`
  flex: 1;
  padding-top: 80px; /* Account for fixed header */
`

function App() {
  return (
    <AppContainer>
      <Header />
      <MainContent>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<ComicDetail />} />
          <Route path="/collection/:id" element={<Collection />} />
          <Route path="/reader/:comicId" element={<ComicReader />} />
          <Route path="/creator" element={<CreatorStudio />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:address" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainContent>
      <Footer />
    </AppContainer>
  )
}

export default App
