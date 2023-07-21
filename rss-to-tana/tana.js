function album(item) {
  return {
    name: item.title,
    supertags: [
      {
        /* Album */
        id: 'eWlghv3V42SH'
      },
    ],
    children: [
      {
        /* Title */
        type: 'field',
        attributeId: 'ksBOEhsvfu',
        children: [
          {
            name: item.title,
          }
        ]
      },
      {
        /* Source */
        type: 'field',
        attributeId: 'SalqarOgiv',
        children: [
          {
            name: item.link
          }
        ]
      }
    ]
  }
}

function website(item) {
  return {
    name: item.title,
    supertags: [
      {
        /* Website */
        id: 'G3E1S3l-dk0v'
      }
    ],
    children: [
      {
        /* URL */
        type: 'field',
        attributeId: 'S4UUISQkxn2X',
        children: [
          {
            dataType: 'url',
            name: item.link
          }
        ]
      },
    ]
  }
}

module.exports = {
  album,
  website,
}
