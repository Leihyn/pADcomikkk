import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ProfileContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  padding: 2rem 0;
`

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`

const Profile: React.FC = () => {
  return (
    <ProfileContainer>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Profile</h1>
          <p>User profile will be displayed here</p>
        </motion.div>
      </Container>
    </ProfileContainer>
  )
}

export default Profile
