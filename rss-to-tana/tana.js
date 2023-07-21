function album(item) {
  return {
    name: '',
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
            name: item.title
          }
        ]
      },
      {
        /* Source */
        type: 'field',
        attributeId: 'SalqarOgiv',
        children: [
          {
            name: item.url
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
        attributeId: 'SYS_A78',
        children: [
          {
            dataType: 'url',
            name: item.url
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
