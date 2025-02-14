import React from 'react'

const SelectedCategory = (select) => {
  return (
    <select>
        <option value="all">All Categories</option>
        <option value="business">Business</option>
        <option value="health">Health</option>
        <option value="history&geography">History & Geography</option>
        <option value="humour">Humour</option>
        <option value="reference">Reference</option>
        <option value="religion">Religion</option>
        <option value="romance">Romance</option>
        <option value="sciencefiction&fantasy">Science Fiction & Fantasy</option>
        <option value="self-help">Self-Help</option>
        <option value ="socialscience">Social Science</option>
        <option value ="teen&youngadult">Teen & Young Adult</option>
        <option value ="Men's Sneaker">Men&apos;s Sneaker</option>
    </select>
  )
}

export default SelectedCategory