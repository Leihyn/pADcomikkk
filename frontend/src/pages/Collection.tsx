import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const CollectionContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  padding: 2rem 0;
`

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`

const Collection: React.FC = () => {
  return (
    <CollectionContainer>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Collection</h1>
          <p>Collection details will be displayed here</p>
        </motion.div>
      </Container>
    </CollectionContainer>
  )
}

export default Collection
