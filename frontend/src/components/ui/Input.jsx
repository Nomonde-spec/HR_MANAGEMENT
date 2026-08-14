import React from 'react';

export default function Input(props) {
  return (
	<input className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300" {...props} />
  );
}
