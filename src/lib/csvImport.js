// CSV Import utilities using PapaParse

export function parseRoomsCSV(file) {
  return new Promise((resolve, reject) => {
    import('papaparse').then(({ default: Papa }) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const errors = []
          const rooms = results.data.map((row, i) => {
            const room = {
              room_number: String(row.room_number || row['Room Number'] || row.number || '').trim(),
              floor: parseInt(row.floor || row.Floor || 1),
              type: (row.type || row.Type || 'Single').trim(),
              capacity: parseInt(row.capacity || row.Capacity || 1),
              monthly_rent: parseFloat(row.monthly_rent || row['Monthly Rent'] || row.rent || 5000),
              status: (row.status || row.Status || 'available').toLowerCase().trim(),
              amenities: row.amenities ? row.amenities.split('|').map(a => a.trim()) : [],
            }
            if (!room.room_number) errors.push(`Row ${i+2}: Missing room_number`)
            if (!['Single','Double','Triple','Dorm'].includes(room.type)) {
              room.type = 'Single'
            }
            if (!['available','occupied','maintenance','reserved'].includes(room.status)) {
              room.status = 'available'
            }
            return room
          })
          resolve({ rooms, errors })
        },
        error: reject
      })
    })
  })
}

export function parseResidentsCSV(file) {
  return new Promise((resolve, reject) => {
    import('papaparse').then(({ default: Papa }) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const errors = []
          const residents = results.data.map((row, i) => {
            const r = {
              full_name: String(row.full_name || row['Full Name'] || row.name || '').trim(),
              phone: String(row.phone || row.Phone || row.mobile || '').trim(),
              email: (row.email || row.Email || '').trim() || null,
              nid: (row.nid || row.NID || row['ID Number'] || '').trim() || null,
              gender: (row.gender || row.Gender || 'Male').trim(),
              occupation: (row.occupation || row.Occupation || '').trim() || null,
              emergency_contact: (row.emergency_contact || row['Emergency Contact'] || '').trim() || null,
              emergency_phone: (row.emergency_phone || row['Emergency Phone'] || '').trim() || null,
              address: (row.address || row.Address || '').trim() || null,
              status: 'active',
            }
            if (!r.full_name) errors.push(`Row ${i+2}: Missing full_name`)
            if (!r.phone) errors.push(`Row ${i+2}: Missing phone`)
            return r
          })
          resolve({ residents, errors })
        },
        error: reject
      })
    })
  })
}

export const ROOMS_CSV_TEMPLATE = `room_number,floor,type,capacity,monthly_rent,status,amenities
101,1,Single,1,5000,available,WiFi|AC
102,1,Double,2,4500,available,WiFi
103,1,Triple,3,3800,available,
201,2,Single,1,5500,available,WiFi|AC|Attached Bath
`

export const RESIDENTS_CSV_TEMPLATE = `full_name,phone,email,nid,gender,occupation,emergency_contact,emergency_phone,address
Arman Hossain,+8801711234567,arman@email.com,1990123456,Male,Student,Karim Hossain,+8801811234567,Mirpur Dhaka
Nazifa Islam,+8801812345678,nazifa@email.com,2000123456,Female,Student,Rahman Islam,+8801912345678,Gulshan Dhaka
`
