import { render } from '@testing-library/react';

import VolatalkContact from './volatalk-contact';

describe('VolatalkContact', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<VolatalkContact />);
    expect(baseElement).toBeTruthy();
  });
});
