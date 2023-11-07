import { render } from '@testing-library/react';

import VolatalkProfile from './volatalk-profile';

describe('VolatalkProfile', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<VolatalkProfile />);
    expect(baseElement).toBeTruthy();
  });
});
