const AWS = require("aws-sdk");
const sinon = require("sinon");
const { expect } = require("chai");

describe("67672805", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    AWS,
    "SecretsManager"
  );

  afterEach(() => {
    console.log("afterEach pre");
    sinon.restore();
    printObjectDescriptor();
    console.log("afterEach post");
  });

  function printObjectDescriptor() {
    const descriptor = Object.getOwnPropertyDescriptor(AWS, "SecretsManager");
    console.log(descriptor);
    console.log(
      "descriptor.value unmodified?",
      descriptor.value === originalDescriptor.value
    );
  }

  it("should get secret value", async () => {
    const data = {
      SecretString: JSON.stringify({
        publicKey: "secretUsername",
        privateKey: "secretPassword"
      })
    };

    const secretsManagerStub = {
      getSecretValue: sinon.stub().callsFake((params, callback) => {
        callback(null, data);
      })
    };
    printObjectDescriptor();
    const SecretsManagerStub = sinon
      .stub(AWS, "SecretsManager")
      .returns(secretsManagerStub);
    printObjectDescriptor();
    const main = require("./main");
    const { username, password } = await main("1");
    expect(username).to.equal("secretUsername");
    expect(password).to.equal("secretPassword");
    sinon.assert.calledOnce(SecretsManagerStub);
    sinon.assert.calledOnceWithExactly(
      secretsManagerStub.getSecretValue,
      {
        SecretId: "1"
      },
      sinon.match.func
    );
  });

  it("should not get secret value if there is an error with SecretsManager", async () => {
    const secretsManagerStub = {
      getSecretValue: sinon.stub().callsFake((params, callback) => {
        const err = new Error("There was an error");
        callback(err);
      })
    };
    printObjectDescriptor();
    const SecretsManagerStub = sinon
      .stub(AWS, "SecretsManager")
      .returns(secretsManagerStub);
    printObjectDescriptor();
    const main = require("./main");
    const { username, password } = await main("1");
    expect(username).to.not.equal("secretUsername");
    expect(password).to.not.equal("secretPassword");
    sinon.assert.calledOnce(SecretsManagerStub);
    sinon.assert.calledOnceWithExactly(
      secretsManagerStub.getSecretValue,
      {
        SecretId: "1"
      },
      sinon.match.func
    );
  });
});
